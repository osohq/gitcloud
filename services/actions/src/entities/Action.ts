import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type Status = "scheduled" | "running" | "complete" | "canceled" | "failed";

@Entity()
export class Action {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ default: "scheduled", nullable: false })
  status: Status;

  @Column({ nullable: false })
  repoId: string;

  @Column({ nullable: false })
  creatorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
