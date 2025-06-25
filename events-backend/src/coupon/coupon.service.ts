import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from './coupon.entity';
import { CouponUsage } from './coupon-usage.entity';
import { CreateCouponDto } from './coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepo: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private couponUsageRepo: Repository<CouponUsage>,
  ) {}

  async createCoupon(dto: CreateCouponDto) {
    // Check if coupon code already exists
    const existingCoupon = await this.couponRepo.findOne({ 
      where: { code: dto.code } 
    });
    
    if (existingCoupon) {
      throw new BadRequestException('Coupon code already exists');
    }

    const coupon = this.couponRepo.create(dto);
    return this.couponRepo.save(coupon);
  }

  async getAllCoupons() {
    return this.couponRepo.find();
  }

  async getCouponById(id: string) {
    const coupon = await this.couponRepo.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async validateAndApplyCoupon(code: string, userId: string, orderAmount: number): Promise<any> {
    // 1. Check if coupon exists and is active
    const coupon = await this.couponRepo.findOne({ where: { code } });
    if (!coupon) throw new NotFoundException('Invalid coupon code');
    if (!coupon.isActive) throw new BadRequestException('Coupon is not active');

    // 2. Check expiry date
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      throw new BadRequestException('Coupon has expired');
    }

    // 3. Check minimum order value
    if (orderAmount < coupon.actualValue) {
      throw new BadRequestException(`Minimum order value should be ${coupon.actualValue}`);
    }

    // 4. Check usage limit for this user
    const usageCount = await this.couponUsageRepo.count({
      where: { userId, couponId: coupon.id }
    });
    if (usageCount >= coupon.usageLimit) {
      throw new BadRequestException('You have already used this coupon maximum times');
    }

    // 5. Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderAmount * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    return {
      coupon,
      discount,
      finalAmount: orderAmount - discount
    };
  }

  async recordCouponUsage(userId: string, couponId: string, orderId: string) {
    const usage = this.couponUsageRepo.create({
      userId,
      couponId,
      orderId
    });
    return this.couponUsageRepo.save(usage);
  }

  async updateCoupon(id: string, dto: Partial<CreateCouponDto>) {
    const coupon = await this.getCouponById(id);
    Object.assign(coupon, dto);
    return this.couponRepo.save(coupon);
  }

  async deleteCoupon(id: string) {
    const coupon = await this.getCouponById(id);
    await this.couponRepo.remove(coupon);
    return { message: 'Coupon deleted successfully' };
  }
}