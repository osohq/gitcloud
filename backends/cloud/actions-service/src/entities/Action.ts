import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type Status = "scheduled" | "running" | "complete" | "canceled";

@Entity()
export class Action {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ default: "scheduled", nullable: false })
  status: Status;

  @Column({ nullable: false })
  repoId: number;

  @Column({ nullable: false })
  creatorId: number;
}
