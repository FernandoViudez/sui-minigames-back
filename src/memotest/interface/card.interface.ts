export type CardId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export interface Card {
  id: CardId;
  image: string;
  location: number;
  per_location: number;
  found_by: string;
}
