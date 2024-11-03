use crate::*;
use near_sdk::near_bindgen;

#[near_bindgen]
impl Max30 {
    pub fn get_state(&self) -> GlobalState {
        return self.global.clone();
    }

    pub fn get_players(&self) -> Vec<Player> {
        self.players.values().cloned().collect()
    }

    pub fn get_player(&self, key: AccountId) -> Player {
        self.players.get(&key).cloned().unwrap()
    }

    pub fn user_exists(&self, account_id: AccountId) -> bool {
        if let Some(exists) = self.users.get(&account_id) {
            return *exists;
        }
        return false;
    }

    pub fn get_winner(&self) -> Option<&Winner> {
        if self.last_winner.is_some() {
            let winner = self.last_winner.as_ref();
            if winner.unwrap().round_num == self.global.round_num {
                return winner;
            } else {
                return None;
            }
        } else {
            return None;
        }
    }

    pub fn get_last_winner(&self) -> Option<&Winner> {
        if self.last_winner.is_some() {
            return self.last_winner.as_ref();
        }
        None
    }
}
