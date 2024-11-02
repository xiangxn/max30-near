use near_sdk::{near, AccountId, BorshStorageKey, NearToken, Timestamp};

#[derive(BorshStorageKey)]
#[near(serializers = [borsh, json])]
pub(crate) enum StorageKey {
    Players,
    Users
}

#[derive(Clone, PartialEq, Eq, PartialOrd, Debug)]
#[near(serializers = [borsh(use_discriminant = true), json])]
pub enum Status {
    Init = 1,
    Wait = 2,
    Ready = 3,
}

#[derive(Clone)]
#[near(serializers = [borsh, json])]
pub struct GlobalState {
    // round number
    pub round_num: u64,
    // Current number of partner
    pub partner_count: u32,
    // Total amount bet
    pub bet_total: NearToken,
    // Current status
    pub status: Status,
    // Maximum number of partner
    pub max_partner_count: u32,
    // Waiting time seconds to partner
    pub wait_time: Timestamp,
    // ready time seconds for lottery draw
    pub ready_time: Timestamp,
    // lottery time seconds
    pub lottery_time: Timestamp,
    pub fee_rate: f64,
}

#[derive(Clone)]
#[near(serializers = [borsh, json])]
pub struct Player {
    pub id: u32,
    pub owner: AccountId,
    pub win_rate: f64,
    pub bet: NearToken,
    pub bet_time: Timestamp,
    pub digital: Vec<u32>,
}
