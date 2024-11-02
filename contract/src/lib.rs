mod events;
mod tools;
mod types;
mod view;

use events::Event;
use types::*;

// Find all our documentation at https://docs.near.org
use near_sdk::store::IterableMap;
use near_sdk::{env, near, require, AccountId, NearToken, PanicOnDefault, Promise};

const STORAGE_COST: NearToken = NearToken::from_yoctonear(10_u128.pow(22)); // 0.01 NEAR
const MIN_BET: NearToken = NearToken::from_yoctonear(10_u128.pow(23)); // 0.1 NEAR
const MAX_BET: NearToken = NearToken::from_near(100); // 100 NEAR

const WAIT_TIME_SEC: u64 = 60 * 1_000_000_000; // Seconds
const READY_TIME_SEC: u64 = 5 * 1_000_000_000; // Seconds

const MAX_PARTNER_COUNT: u32 = 30;
const FEE_RATE: f64 = 0.02;

// Define the contract structure
#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Max30 {
    global_state: GlobalState,
    players: IterableMap<AccountId, Player>,
    owner_id: AccountId,
    first_account: Option<AccountId>,
}

// Implement the contract structure
#[near]
impl Max30 {
    #[init]
    #[private]
    pub fn init(owner_id: AccountId) -> Self {
        Self {
            global_state: GlobalState {
                round_num: 1,
                partner_count: 0,
                bet_total: NearToken::from_near(0),
                status: Status::Init,
                max_partner_count: MAX_PARTNER_COUNT,
                wait_time: 0,
                ready_time: 0,
                lottery_time: 0,
                fee_rate: FEE_RATE,
            },
            players: IterableMap::new(StorageKey::Players),
            owner_id,
            first_account: None,
        }
    }
    // Start placing bets
    #[payable]
    pub fn dobet(&mut self) {
        require!(
            self.global_state.status < Status::Ready,
            "bet time has expired"
        );
        require!(
            self.global_state.partner_count < self.global_state.max_partner_count,
            "The maximum number of partner has been reached"
        );
        let account_id = env::predecessor_account_id();
        let quantity = env::attached_deposit();
        let exists = self.players.contains_key(&account_id);
        let amount;
        if exists {
            require!(quantity >= MIN_BET, "bet too small");
            require!(quantity <= MAX_BET, "bet too big");
            amount = quantity;
        } else {
            require!(
                quantity >= MIN_BET.saturating_add(STORAGE_COST),
                "bet too small"
            );
            require!(
                quantity <= MAX_BET.saturating_add(STORAGE_COST),
                "bet too big"
            );
            amount = quantity.saturating_sub(STORAGE_COST);
        }
        self.global_state.partner_count += 1;
        if self.global_state.partner_count == 1 {
            self.first_account = Some(account_id.clone());
        }
        self.global_state.bet_total = self.global_state.bet_total.saturating_add(amount);
        let time = env::block_timestamp();
        if exists {
            let player = self.players.get_mut(&account_id).unwrap();
            player.bet = player.bet.saturating_add(amount);
        } else {
            let player = Player {
                id: self.global_state.partner_count,
                owner: account_id.clone(),
                win_rate: 0.0,
                bet: amount,
                bet_time: time,
                digital: Vec::new(),
            };
            self.players.insert(account_id.clone(), player);
        }

        // Update user winning rate
        for (_, player) in self.players.iter_mut() {
            let wr = (player.bet.as_yoctonear() as f64)
                / (self.global_state.bet_total.as_yoctonear() as f64);
            player.win_rate = (wr * 100.0).floor() / 100.0;
        }

        // trigger event
        Event::Betting {
            account_id: &account_id,
            bet: &amount.to_string(),
            time: &time,
        }
        .emit();

        // Processing status
        if self.global_state.partner_count == 2 {
            self.global_state.status = Status::Wait;
            self.global_state.wait_time = time + WAIT_TIME_SEC;
        } else if self.global_state.partner_count == self.global_state.max_partner_count {
            self.do_ready();
        }
    }

    pub fn ready(&mut self) {
        require!(
            self.global_state.status == Status::Wait,
            "Can only be called in Wait state"
        );
        require!(
            self.global_state.wait_time <= env::block_timestamp(),
            "The waiting time has not been reached yet"
        );
        self.do_ready();
    }

    pub fn lottery(&mut self) {
        require!(
            self.global_state.status == Status::Ready,
            "Can only be called in Ready state"
        );
        require!(
            self.global_state.ready_time <= env::block_timestamp(),
            "The ready time has not been reached yet"
        );

        // Random winner
        let random_seed = env::random_seed();
        let num = u64::from_le_bytes([
            random_seed[0],
            random_seed[1],
            random_seed[2],
            random_seed[3],
            random_seed[4],
            random_seed[5],
            random_seed[6],
            random_seed[7],
        ]);
        let lottery: u32 = (num % 1000) as u32;
        let mut winner: Option<AccountId> = None;
        for (key, player) in self.players.iter() {
            // env::log_str(&format!(
            //     "owner: {}, digital: {}",
            //     player.owner,
            //     tools::vector_to_str(&player.digital)
            // ));
            if player.digital.contains(&lottery) {
                winner = Some(key.clone());
                break;
            }
        }

        // Cleaning the digital
        for (_, player) in self.players.iter_mut() {
            player.digital.clear();
            player.digital.shrink_to_fit();
        }

        if let Some(win) = winner {
            // Calculating Bonuses and Fees
            let fr = self.global_state.fee_rate * 100_f64;
            let fee = self
                .global_state
                .bet_total
                .saturating_mul(fr as u128)
                .saturating_div(100);
            let win_amount = self.global_state.bet_total.saturating_sub(fee);
            // transfer to owner
            Promise::new(self.owner_id.clone()).transfer(fee);
            // transfer to winner
            Promise::new(win.clone()).transfer(win_amount);

            // reset state data
            self.reset_state();
            self.global_state.round_num += 1;

            // trigger event
            Event::Winning {
                account_id: &win,
                amount: &win_amount.to_string(),
                time: &env::block_timestamp(),
                fee: &fee.to_string(),
            }
            .emit();
        } else {
            self.reset_state();
            self.global_state.round_num += 1;
        }
    }
}

impl Max30 {
    // Reset state
    fn reset_state(&mut self) {
        self.global_state.status = Status::Init;
        self.global_state.bet_total = NearToken::from_near(0);
        self.global_state.partner_count = 0;
        self.global_state.wait_time = 0;
        self.global_state.ready_time = 0;
        self.global_state.lottery_time = 0;
        self.players.clear();
        self.first_account = None;
    }

    fn do_ready(&mut self) {
        self.global_state.status = Status::Ready;
        self.global_state.ready_time = env::block_timestamp() + READY_TIME_SEC;

        // Make up the difference in winning rate
        let mut diff = 1f64;
        for (_, player) in self.players.into_iter() {
            diff -= player.win_rate;
        }
        if self.first_account.is_some() {
            if diff > 0.0 {
                let player = self
                    .players
                    .get_mut(self.first_account.as_ref().unwrap())
                    .unwrap();
                player.win_rate += diff;
            }
        }

        // Initializing an Array
        let mut arr: Vec<u32> = (0..1000).collect();
        tools::shuffle(&mut arr);

        // Assigning numbers to players
        let mut start: usize = 0;
        for (_, player) in self.players.iter_mut() {
            let end = start + (player.win_rate * 1000.0).floor() as usize;
            for i in start..end {
                let value = arr[i];
                player.digital.push(value);
            }
            start = end;
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::{Max30, Status};
    use near_sdk::env::log_str;
    use near_sdk::test_utils::test_env::{alice, bob, carol};
    use near_sdk::NearToken;
    use near_sdk::{test_utils::VMContextBuilder, testing_env};

    fn start_alice() -> Max30 {
        // initialize contract and deposit jackpod with 100 NEAR
        let context = VMContextBuilder::new()
            .current_account_id(alice())
            .predecessor_account_id(alice())
            .signer_account_id(alice())
            .build();
        testing_env!(context.clone());
        let contract = Max30::init(alice());
        contract
    }

    #[test]
    fn test_bet() {
        let mut contract = start_alice();
        let info = contract.get_state();
        assert_eq!(info.status, Status::Init);

        // Bot Betting
        let mut context = VMContextBuilder::new()
            .predecessor_account_id(bob())
            .signer_account_id(bob())
            .attached_deposit(NearToken::from_near(1))
            .build();
        testing_env!(context.clone());
        contract.dobet();
        assert_eq!(contract.get_state().partner_count, 1);

        // Carol Betting
        context.predecessor_account_id = carol();
        context.signer_account_id = carol();
        context.attached_deposit = NearToken::from_near(1);
        testing_env!(context.clone());
        contract.dobet();
        assert_eq!(contract.get_player(carol()).win_rate, 0.5);
        assert_eq!(contract.get_state().partner_count, 2);
        assert_eq!(contract.get_state().status, Status::Wait);
        assert_eq!(
            contract.get_state().bet_total,
            NearToken::from_millinear(1980)
        );

        let time_msg = format!("block_timestamp: {}", context.block_timestamp);
        log_str(&time_msg);
        // Speed ​​up time
        context.block_timestamp += 61 * 1_000_000_000;
        context.random_seed = [
            11, 22, 33, 4, 5, 6, 7, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 100,
        ];

        testing_env!(context.clone());
        contract.ready();
        assert_eq!(contract.get_state().status, Status::Ready);

        // Speed ​​up time
        context.block_timestamp += 6 * 1_000_000_000;
        testing_env!(context.clone());
        contract.lottery();
        assert_eq!(contract.get_state().partner_count, 0);
        assert_eq!(contract.get_state().status, Status::Init);
    }
}
