use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{AccountId, Balance, BorshStorageKey, Timestamp};

#[derive(BorshStorageKey, BorshSerialize)]
pub(crate) enum StorageKey {
    Players,
    Users,
}

#[derive(
    Serialize,
    Deserialize,
    BorshDeserialize,
    BorshSerialize,
    Clone,
    PartialEq,
    Eq,
    PartialOrd,
    Debug,
)]
#[serde(crate = "near_sdk::serde")]
pub enum Status {
    Init = 1,
    Wait,
    Ready,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct GlobalState {
    // round number
    pub round_num: u64,
    // Current number of partner
    pub partner_count: u32,
    // Total amount bet
    pub bet_total: Balance,
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

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Player {
    pub id: u32,
    pub owner: AccountId,
    pub win_rate: f64,
    pub bet: Balance,
    pub bet_time: Timestamp,
    pub digital: Vec<u32>,
}
