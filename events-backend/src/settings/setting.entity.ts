// src/faq/entities/faq.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';



@Entity('privacy_policies')
export class PrivacyPolicy {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    content!: string; // The content of the terms and conditions

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}


@Entity('terms_conditions')
export class TermsConditions {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    content!: string; // The content of the terms and conditions

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

@Entity('banners')
export class Banner {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('simple-array')
    imageUrls!: string[]; // Array of image URLs

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
