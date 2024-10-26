use near_sdk::{log, serde::Serialize, serde_json::json, AccountId, Timestamp};

const EVENT_STANDARD: &str = "max30-operate";
const EVENT_STANDARD_VERSION: &str = "1.0.0";

#[derive(Serialize, Clone)]
#[serde(crate = "near_sdk::serde")]
#[serde(tag = "event", content = "data")]
#[serde(rename_all = "snake_case")]
#[must_use = "Don't forget to `.emit()` this event"]
pub enum Event<'a> {
    Betting {
        account_id: &'a AccountId,
        bet: &'a String,
        time: &'a Timestamp,
    },
    Winning {
        account_id: &'a AccountId,
        amount: &'a String,
        time: &'a Timestamp,
        fee: &'a String,
    },
}

impl Event<'_> {
    pub fn emit(&self) {
        let data = json!(self);
        let event_json = json!({
            "standard": EVENT_STANDARD,
            "version": EVENT_STANDARD_VERSION,
            "event": data["event"],
            "data": [data["data"]]
        })
        .to_string();
        log!("EVENT_JSON:{}", event_json);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::{test_utils::{self, test_env::alice}, NearToken};

    #[test]
    fn test_betting() {
        Event::Betting {
            account_id: &alice(),
            bet: &NearToken::from_near(1).exact_amount_display(),
            time: &1600000000000,
        }
        .emit();
        assert_eq!(
            test_utils::get_logs()[0],
            r#"EVENT_JSON:{"standard":"max30-operate","version":"1.0.0","event":"betting","data":[{"account_id":"alice.near","bet":"1000000000000000000000000","time":1600000000000}]}"#
        );
    }
}
