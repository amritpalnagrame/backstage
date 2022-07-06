/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useEffect, useState } from 'react';
import { Box, Grid, MenuItem, Select } from '@material-ui/core';
import { useApi, storageApiRef } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';
import {
  InfoCard,
  Progress,
  ErrorPanel,
  Link,
} from '@backstage/core-components';
import { newRelicDashboardApiRef } from '../../../api';
import { DashboardSnapshotSummary } from '../../../api/NewRelicDashboardApi';

type Props = {
  guid: string;
  name: string;
  permalink: string;
};

export const DashboardSnapshot = ({ guid, name, permalink }: Props) => {
  const newRelicDashboardAPI = useApi(newRelicDashboardApiRef);
  const storageApi = useApi(storageApiRef);
  const newrelicDashboardStore = storageApi.forBucket('newrelic-dashboard');
  const [newDuration, setNewDuration] = useState(2592000000);

  useEffect(() => {
    if (newrelicDashboardStore.snapshot(guid).value)
      setNewDuration(Number(newrelicDashboardStore.snapshot(guid).value));
  }, [guid, newrelicDashboardStore]);

  const { value, loading, error } = useAsync(async (): Promise<
    DashboardSnapshotSummary | undefined
  > => {
    const dashboardObject: Promise<DashboardSnapshotSummary | undefined> =
      newRelicDashboardAPI.getDashboardSnapshot(guid, newDuration);
    return dashboardObject;
  }, [guid, newDuration]);

  if (loading) {
    return <Progress />;
  }
  if (error) {
    return <ErrorPanel title={error.name} defaultExpanded error={error} />;
  }

  const url =
    value?.getDashboardSnapshot?.data?.dashboardCreateSnapshotUrl?.replace(
      /\pdf$/i,
      'png',
    );
  return (
    <Grid container>
      <InfoCard
        variant="gridItem"
        title={name}
        action={
          <Select
            style={{ margin: '15px 10px 0 0' }}
            value={newDuration}
            onChange={event => {
              setNewDuration(Number(event.target.value));
              newrelicDashboardStore.set(guid, Number(event.target.value));
            }}
          >
            <MenuItem value={3600000}>1 Hour</MenuItem>
            <MenuItem value={43200000}>12 Hours</MenuItem>
            <MenuItem value={86400000}>1 Day</MenuItem>
            <MenuItem value={259200000}>3 Days</MenuItem>
            <MenuItem value={604800000}>1 Week</MenuItem>
            <MenuItem value={2592000000}>1 Month</MenuItem>
          </Select>
        }
      >
        <Box display="flex">
          <Box flexGrow="1">
            <Link to={permalink}>
              {url ? (
                <img
                  alt={`${name} Dashbord`}
                  style={{ border: 'solid 1px black' }}
                  src={url}
                />
              ) : (
                'Dashboard loading... , click here to open if it did not render correctly'
              )}
            </Link>
          </Box>
        </Box>
      </InfoCard>
    </Grid>
  );
};
