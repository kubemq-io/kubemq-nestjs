import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';
const token = process.env.KUBEMQ_TOKEN;
if (!token) {
  throw new Error('KUBEMQ_TOKEN environment variable is required. Set it before running this example.');
}

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-configuration-token-auth-server',
      credentials: token,
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_SERVICE',
      address,
      clientId: 'nestjs-configuration-token-auth-client',
      credentials: token,
    }),
  ],
})
export class AppModule {}
