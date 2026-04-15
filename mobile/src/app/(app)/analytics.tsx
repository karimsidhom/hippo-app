import { View } from 'react-native';
import { Screen, Text, Card } from '@/components';

/**
 * Stub. The web app's analytics tab is a deep dashboard with learning
 * curves, heatmaps, and the EPA panel. Porting the EPA toggle + cases-
 * vs-target charts here is Phase 3 — the data is already reachable
 * via /api/epa/observations and /api/cases, but building touch-
 * optimized charts (not mini HTML/SVG) needs care.
 */
export default function AnalyticsScreen() {
  return (
    <Screen>
      <View style={{ gap: 4, marginBottom: 20 }}>
        <Text variant="label" tone="subtle" uppercase>
          Analytics
        </Text>
        <Text variant="h1">Stats</Text>
      </View>

      <Card>
        <Text variant="body" tone="muted">
          Analytics are coming to mobile — learning curves, EPA progress, and
          the specialty/foundations toggle. For now, open Hippo on the web
          for the full analytics view.
        </Text>
      </Card>
    </Screen>
  );
}
