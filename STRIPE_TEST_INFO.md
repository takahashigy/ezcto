# Stripe测试环境配置

## 当前状态
✅ **测试模式（Test Mode）已激活**

所有支付都是模拟的，不会产生真实扣款。

## 产品配置

### Website Deployment - $299
- **产品ID**: `prod_TqYyz7JD2gMdb8`
- **价格ID**: `price_1SsrqbE7ohnIBMg6VifL1Rr8`
- **金额**: $299.00 USD
- **类型**: 一次性付款
- **环境变量**: `STRIPE_PRICE_DEPLOYMENT`

## 测试卡号

使用以下测试卡号进行支付测试：

### 成功支付
- **卡号**: `4242 4242 4242 4242`
- **过期日期**: 任何未来日期（如 12/34）
- **CVC**: 任何3位数字（如 123）
- **邮编**: 任何5位数字（如 12345）

### 其他测试场景
- **需要3D验证**: `4000 0027 6000 3184`
- **支付失败（余额不足）**: `4000 0000 0000 9995`
- **支付失败（被拒绝）**: `4000 0000 0000 0002`

## Webhook配置
- **Webhook URL**: `https://your-domain.com/api/stripe/webhook`
- **Webhook Secret**: `whsec_aIEIZuHuBSBNzDtMzr5ejvBsU1omwurc`
- **监听事件**: `checkout.session.completed`

## 切换到生产模式

当准备接受真实付款时：

1. **在Stripe Dashboard中**：
   - 切换到Live Mode（右上角）
   - 完成账户验证（提供公司/个人信息）
   - 添加银行账户信息

2. **创建生产环境产品**：
   ```bash
   # 使用Live Mode的API密钥运行
   node scripts/create-stripe-products.mjs
   ```

3. **更新环境变量**：
   - `STRIPE_SECRET_KEY`: 替换为Live Mode的密钥（sk_live_...）
   - `VITE_STRIPE_PUBLISHABLE_KEY`: 替换为Live Mode的公钥（pk_live_...）
   - `STRIPE_PRICE_DEPLOYMENT`: 替换为Live Mode的价格ID

4. **配置生产环境Webhook**：
   - 在Stripe Dashboard中添加生产环境的Webhook URL
   - 更新 `STRIPE_WEBHOOK_SECRET` 为新的签名密钥

## 注意事项

⚠️ **测试模式限制**：
- 不会产生真实交易
- 不会发送真实的邮件通知
- 不会产生真实的税务文件

✅ **测试模式优势**：
- 可以无限次测试
- 不需要真实的银行账户
- 可以模拟各种支付场景（成功、失败、退款等）

## 当前功能状态

✅ 已完成：
- Stripe产品和价格创建
- 环境变量配置
- Checkout会话创建
- 付费墙UI集成
- Webhook处理（自动部署）

🔄 待测试：
- 完整的支付流程（从点击到成功）
- Webhook触发和部署逻辑
- 付费后解锁功能（下载ZIP、访问网站）
