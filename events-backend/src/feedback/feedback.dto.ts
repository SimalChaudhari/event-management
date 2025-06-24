import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class FeedbackDto {

    @IsNotEmpty()
    @IsUUID()
    eventId!: string;

    @IsNotEmpty()
    @IsString()
    name?: string;
  
    @IsNotEmpty()
    @IsString()
    title?: string;
  
    @IsNotEmpty()
    @IsString()
    feedback?: string;
  }