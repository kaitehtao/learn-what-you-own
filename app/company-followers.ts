export type CompanyDemand = {
  ticker: string;
  vote_count: number;
  page_views: number;
  demand_score: number;
};

export type CompanyFollower = {
  ticker: string;
  follower_count: number;
};

export function followingLabel(count: number) {
  return `${count.toLocaleString()} ${count === 1 ? "person" : "people"} following`;
}
