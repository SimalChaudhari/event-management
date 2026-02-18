import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from './coupon.entity';
import { CouponUsage } from './coupon-usage.entity';
import { CreateCouponDto } from './coupon.dto';
import { validateCouponDatesForCreate, validateCouponDateNotPast } from '../utils/coupon-validation.utils';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepo: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private couponUsageRepo: Repository<CouponUsage>,
  ) {}

  async createCoupon(dto: CreateCouponDto) {
    // Check if voucher name already exists
    const existingCoupon = await this.couponRepo.findOne({ 
      where: { name: dto.name } 
    });
    
    if (existingCoupon) {
      throw new BadRequestException('Voucher name already exists');
    }

    const { validFrom: validFromDate, validTo: validToDate } = validateCouponDatesForCreate(
      dto.validFrom,
      dto.validTo,
    );

    const couponData: Partial<Coupon> = {
      ...dto,
      validFrom: validFromDate,
      validTo: validToDate,
    };

    const coupon = this.couponRepo.create(couponData);
    return this.couponRepo.save(coupon);
  }

  /** Map coupon to public response (only fields shown to user) */
  private toPublicCouponResponse(coupon: Coupon): {
    id: string;
    name: string;
    actualValue: number;
    discountValue: number;
    discountType: string;
    validFrom: Date;
    validTo: Date;
  } {
    return {
      id: coupon.id,
      name: coupon.name,
      actualValue: coupon.actualValue ?? 0,
      discountValue: coupon.discountValue ?? 0,
      discountType: coupon.discountType,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom) : new Date(),
      validTo: coupon.validTo ? new Date(coupon.validTo) : new Date(),
    };
  }

  async getAllCoupons(isAdmin = false) {
    const coupons = await this.couponRepo.find();
    // Admin sees full data; user sees only public fields
    if (isAdmin) {
      return coupons;
    }
    return coupons.map((c) => this.toPublicCouponResponse(c));
  }

  /**
   * Get coupons with pagination, search and sort (for admin list).
   * Returns { data, pagination, metadata } in the same format as register-events.
   */
  async getAllCouponsPaginated(filters: {
    page?: number;
    limit?: number;
    keyword?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const page = filters?.page ?? 1;
    const limit = Math.min(Math.max(filters?.limit ?? 10, 1), 100);
    const sortBy = filters?.sortBy ?? 'name';
    const sortOrder = (filters?.sortOrder ?? 'ASC').toUpperCase() as 'ASC' | 'DESC';
    const keyword = filters?.keyword?.trim();

    const qb = this.couponRepo.createQueryBuilder('coupon');

    if (keyword) {
      qb.andWhere('LOWER(coupon.name) LIKE LOWER(:keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    const total = await qb.getCount();

    const allowedSort: Record<string, string> = {
      name: 'coupon.name',
      discountValue: 'coupon.discountValue',
      actualValue: 'coupon.actualValue',
      usageLimit: 'coupon.usageLimit',
      validFrom: 'coupon.validFrom',
      validTo: 'coupon.validTo',
      isActive: 'coupon.isActive',
      createdAt: 'coupon.createdAt',
      updatedAt: 'coupon.updatedAt',
    };
    const orderBy = allowedSort[sortBy] ?? 'coupon.name';
    qb.orderBy(orderBy, sortOrder);

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const coupons = await qb.getMany();
    const totalPages = Math.ceil(total / limit);

    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    const metadata = {
      page,
      limit,
      total,
    };

    return {
      data: coupons,
      pagination,
      metadata,
    };
  }

  async getCouponById(id: string) {
    const coupon = await this.couponRepo.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async getCouponByName(name: string) {
    const coupon = await this.couponRepo.findOne({ where: { name } });
    if (!coupon) {
      throw new NotFoundException('Voucher not found');
    }
    return coupon;
  }

  async validateAndApplyCoupon(
    name: string,
    userId: string,
    orderAmount: number,
  ): Promise<any> {
    // 1. Check if voucher exists and is active
    const coupon = await this.couponRepo.findOne({ where: { name } });
    if (!coupon) throw new NotFoundException('Invalid voucher name');
    if (!coupon.isActive) throw new BadRequestException('Voucher is not active');

    // 2. Check validity date range (compare by calendar day in UTC to avoid timezone issues)
    const now = new Date();
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    if (coupon.validFrom) {
      const validFrom = new Date(coupon.validFrom);
      const validFromDayUTC = Date.UTC(validFrom.getUTCFullYear(), validFrom.getUTCMonth(), validFrom.getUTCDate());
      if (todayUTC < validFromDayUTC) {
        throw new BadRequestException('Voucher is not yet valid');
      }
    }
    if (coupon.validTo) {
      const validTo = new Date(coupon.validTo);
      const validToDayUTC = Date.UTC(validTo.getUTCFullYear(), validTo.getUTCMonth(), validTo.getUTCDate());
      if (todayUTC > validToDayUTC) {
        throw new BadRequestException('Voucher has expired');
      }
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
    if (dto.validFrom !== undefined) {
      coupon.validFrom = validateCouponDateNotPast(dto.validFrom, 'validFrom') ?? coupon.validFrom;
    }
    if (dto.validTo !== undefined) {
      coupon.validTo = validateCouponDateNotPast(dto.validTo, 'validTo') ?? coupon.validTo;
    }
    const finalValidFrom = coupon.validFrom ? new Date(coupon.validFrom) : null;
    const finalValidTo = coupon.validTo ? new Date(coupon.validTo) : null;
    if (finalValidFrom && finalValidTo && finalValidFrom > finalValidTo) {
      throw new BadRequestException('Valid from date and time must be before valid to date and time.');
    }
    const { validFrom: _vf, validTo: _vt, ...rest } = dto;
    Object.assign(coupon, rest);
    return this.couponRepo.save(coupon);
  }

  async deleteCoupon(id: string) {
    const coupon = await this.getCouponById(id);
    // Force delete: remove all associated coupon usages first
    await this.couponUsageRepo.delete({ couponId: id });
    await this.couponRepo.remove(coupon);
    return { message: 'Coupon and all associated usages deleted successfully' };
  }
}