export interface Reel {
    id: string;
    caption: string;
    image: File;
    reel_owner: number;
    likes?: number[];
    loves?: number[];
    celebrates?: number[];
    reel_conversation?: any;
}
