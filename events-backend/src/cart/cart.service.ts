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

    async getUserCarts(userId: string) {
        const carts = await this.cartRepository.find({ where: { userId } });
    
        const enrichedCarts = await Promise.all(
            carts.map(async (cart) => {
                const event = await this.eventService.getEventById(cart.eventId);
                const { userId, eventId, ...cartDetails } = cart;
    
                return {
                    ...cartDetails,
                    event,
                };
            })
        );
    
        return enrichedCarts;
    }
    

    async getCartById(id: string, userId: string) {
        const cart = await this.cartRepository.findOne({ where: { id, userId } }); // Restrict by userId
        if (!cart) throw new NotFoundException('Cart not found');
    
        const event = await this.eventService.getEventById(cart.eventId);
        const { userId: _, eventId, ...cartDetails } = cart;
    
        return {
            ...cartDetails,
            event,
        };
    }
    

    async deleteCart(id: string, userId: string) {
        const cart = await this.cartRepository.findOne({ where: { id, userId } }); // Only find if user is the owner
        if (!cart) throw new NotFoundException('Cart not found or you are not authorized to delete this item');
    
        await this.cartRepository.remove(cart);
        return {
            success: true,
            message: 'Cart item deleted successfully',
        };
    }
    
}