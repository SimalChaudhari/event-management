//users.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserEntity } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async getAll(): Promise<Partial<UserEntity>[]> {
    const users = await this.userRepository.find();
    return users.map(({ password, ...rest }) => rest);
  }
  async getById(id: string): Promise<Partial<UserEntity>> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found or has been deleted');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async delete(id: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } }); // Correct way to find by ID
    if (!user) {
      throw new NotFoundException('User not found');
    }

      // Delete profile picture from filesystem if exists
  if (user.profilePicture) {
    const filePath = path.resolve(user.profilePicture);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

    await this.userRepository.remove(user); 
    return { message: 'User deleted successfully' };
  }




async update(
  id: string,
  updateData: Partial<UserEntity>,
): Promise<Partial<UserEntity>> {

  const user = await this.userRepository.findOne({
    where: { id },
  });
  if (!user) {
    throw new NotFoundException('User not found or has been deleted');
  }

    // Check if email is being updated and already exists for another user
    if (updateData.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email, id: Not(id) },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

  // Remove sensitive fields from updateData
  const {
    password,
    id: userId,
    otp,
    otpExpiry,
    ...safeUpdateData
  } = updateData;

  // Update the user
  Object.assign(user, safeUpdateData);
  const updatedUser = await this.userRepository.save(user);

  // Remove sensitive fields from response
  const {
    password: _,
    otp: ___,
    otpExpiry: ____,
    ...result
  } = updatedUser;

  return result;
}
}
