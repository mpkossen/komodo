use std::collections::VecDeque;

use anyhow::Context;
use async_trait::async_trait;
use monitor_types::{
    monitor_timestamp,
    requests::write::{
        PushRecentlyViewed, PushRecentlyViewedResponse, SetLastSeenUpdate,
        SetLastSeenUpdateResponse,
    },
};
use mungos::mongodb::bson::{doc, to_bson};
use resolver_api::Resolve;

use crate::{auth::RequestUser, state::State};

const RECENTLY_VIEWED_MAX: usize = 10;

#[async_trait]
impl Resolve<PushRecentlyViewed, RequestUser> for State {
    async fn resolve(
        &self,
        PushRecentlyViewed { resource }: PushRecentlyViewed,
        user: RequestUser,
    ) -> anyhow::Result<PushRecentlyViewedResponse> {
        let mut recently_viewed = self
            .db
            .users
            .find_one_by_id(&user.id)
            .await
            .context("failed at mongo query")?
            .context("no user found with id")?
            .recently_viewed
            .into_iter()
            .filter(|r| !resource.eq(r))
            .take(RECENTLY_VIEWED_MAX - 1)
            .collect::<VecDeque<_>>();

        recently_viewed.push_front(resource);

        let recently_viewed =
            to_bson(&recently_viewed).context("failed to convert recently views to bson")?;

        self.db
            .users
            .update_one(
                &user.id,
                mungos::Update::Set(doc! {
                    "recently_viewed": recently_viewed
                }),
            )
            .await
            .context("context")?;

        Ok(PushRecentlyViewedResponse {})
    }
}

#[async_trait]
impl Resolve<SetLastSeenUpdate, RequestUser> for State {
    async fn resolve(
        &self,
        SetLastSeenUpdate {}: SetLastSeenUpdate,
        user: RequestUser,
    ) -> anyhow::Result<SetLastSeenUpdateResponse> {
        self.db
            .users
            .update_one(
                &user.id,
                mungos::Update::Set(doc! {
                    "last_update_view": monitor_timestamp()
                }),
            )
            .await
            .context("failed to update user last_update_view")?;
        Ok(SetLastSeenUpdateResponse {})
    }
}
