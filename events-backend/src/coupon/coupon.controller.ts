import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto, ApplyCouponDto } from './coupon.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';

@Controller('api/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CouponController {
  constructor(private couponService: CouponService) {}

  @Post('create')
  @Roles(UserRole.Admin)
  async createCoupon(@Body() dto: CreateCouponDto) {
    return this.couponService.createCoupon(dto);
  }

  @Get()
  // @Roles(UserRole.Admin)
  async getAllCoupons(@Request() req?: any) {
    const isAdmin = req?.user?.role === UserRole.Admin;
    return this.couponService.getAllCoupons(isAdmin);
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  async getCouponById(@Param('id') id: string) {
    return this.couponService.getCouponById(id);
  }

  @Put('update/:id')
  @Roles(UserRole.Admin)
  async updateCoupon(@Param('id') id: string, @Body() dto: Partial<CreateCouponDto>) {
    return this.couponService.updateCoupon(id, dto);
  }

  @Delete('delete/:id')
  @Roles(UserRole.Admin)
  async deleteCoupon(@Param('id') id: string) {
    return this.couponService.deleteCoupon(id);
  }

  @Post('validate')
  async validateCoupon(@Body() dto: ApplyCouponDto, @Request() req: any) {
    const userId = req?.user?.id;
    if (!userId) {
      return { valid: false, message: 'User not authenticated' };
    }
    const orderAmount = Number(dto.orderAmount ?? 0);
    const result = await this.couponService.validateAndApplyCoupon(
      dto.name,
      userId,
      orderAmount,
    );
    return {
      valid: true,
      discount: result.discount,
      finalAmount: result.finalAmount,
      coupon: result.coupon,
    };
  }
}