import { Reel } from "./Reel";
import { Tag } from "./tag";

export interface Story {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  image: File;
  reels: Reel[];
  tags: Tag[];
  owner: number;
  likes?: number[];
  loves?: number[];
  celebrates?: number[];
  story_conversation?: any;
}

