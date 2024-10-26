use crate::*;
use near_sdk::near_bindgen;

#[near_bindgen]
impl Max30 {
    pub fn get_state(&self) -> GlobalState {
        return self.global_state.clone();
    }

    pub fn get_players(&self) -> Vec<Player> {
        self.players.values().collect()
    }

    pub fn get_player(&self, key: u32) -> Player {
        self.players.get(&key).unwrap()
    }

    pub fn user_exists(&self, account_id: AccountId) -> bool {
        self.users.contains(&account_id)
    }
}
