export interface GameData {
  _id: string;
  name: string;
  type: string;
  status: string;
  round: number;
  calledNumbers: number[];
  winners: { playerName: string; round: number; wonAt: string }[];
  createdAt: string;
}

export interface PlayerData {
  _id: string;
  name: string;
  online: boolean;
}
