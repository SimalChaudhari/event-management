// src/services/cart.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './cart.entity';
import { CartDto } from './cart.dto';
import { EventService } from 'event/event.service';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,
        private eventService: EventService, // Inject EventService
    ) {}

    async cartExists(userId: string, eventId: string): Promise<boolean> {
        const cart = await this.cartRepository.findOne({ where: { userId, eventId } });
        return !!cart; // Return true if cart exists, false otherwise
    }

    async addToCart(cartDto: CartDto) {
        const cartEntry = this.cartRepository.create(cartDto);
        return await this.cartRepository.save(cartEntry);
    }

    async getAllCarts() {
        const carts = await this.cartRepository.createQueryBuilder('cart')
            .leftJoinAndSelect('cart.event', 'event') // Join with Event entity
            .getMany();
    
        // Map over the carts to exclude userId and eventId
        return carts.map(({ userId, eventId, ...cartDetails }) => ({
            ...cartDetails, // Include all other cart details
        }));
    }

    async getCartById(id: string) {
        const cart = await this.cartRepository.findOne({ where: { id } });
        if (!cart) throw new NotFoundException('Cart not found');
        const event = await this.eventService.getEventById(cart.eventId);
        const { userId, eventId, ...cartDetails } = cart; // Destructure to exclude userId and eventId

        
        return {
            ...cartDetails,
            event, // Include event details in the response
        };
    }

    async deleteCart(id: string) {
        const cart = await this.cartRepository.findOne({ where: { id } });
        if (!cart) throw new NotFoundException('Cart not found');
        await this.cartRepository.remove(cart);
        return {
            success: true,
            message: 'Cart item deleted successfully',
        };
    }
}