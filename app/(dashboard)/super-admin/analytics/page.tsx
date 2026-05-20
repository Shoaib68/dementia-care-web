import { AnalyticsClient } from './_components/AnalyticsClient';

/**
 * System Analytics Page - Server Component
 * Renders on server for faster initial load, delegates interactivity to client component
 * 
 * Benefits of server component approach:
 * - Faster initial HTML delivery
 * - Smaller JavaScript bundle
 * - Better SEO and performance metrics
 */
export default function SystemAnalyticsPage() {
  return <AnalyticsClient />;
}
