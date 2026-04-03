export interface GameData {
  _id: string;
  name: string;
  type: string;
  status: string;
  round: number;
  calledNumbers: number[];
  cardsPerPlayer: number;
}

export interface PlayerData {
  _id: string;
  name: string;
  cards: number[][][];
  markedNumbersPerCard: number[][];
}

export interface PlayerNotification {
  id: string;
  message: string;
  type: 'join' | 'leave' | 'reconnect';
}

export interface AdminMessage {
  id: string;
  content: string;
}
