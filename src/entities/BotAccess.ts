import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("bot_access")
@Index(["userId", "botKey"], { unique: true })
export class BotAccess {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "int" })
    userId!: number;

    @Column({ type: "varchar", length: 128 })
    botKey!: string;

    @Column({ type: "boolean", default: false })
    hasPaid!: boolean;

    @Column({ type: "timestamp", nullable: true })
    revokedAt?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
