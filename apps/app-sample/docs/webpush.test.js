import request from "supertest";
import express from "express";
import webpushRouter from "../routes/webpush";
import { authFns } from "@es-labs/node/auth";
import fcm from "@es-labs/node/comms/fcm";
import webpush from "@es-labs/node/comms/webpush";

jest.mock('@es-labs/node/auth');
jest.mock('@es-labs/node/comms/fcm');
jest.mock('@es-labs/node/comms/webpush');

describe('POST /send/:id', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(webpushRouter);
    jest.clearAllMocks();
  });

  it('should send FCM notification successfully', async () => {
    authFns.findUser.mockResolvedValue({ id: '1', pnToken: 'fcm-token' });
    fcm.send.mockResolvedValue({ success: true });

    const res = await request(app)
      .post('/send/1')
      .send({ mode: 'FCM', data: { title: 'Test', body: 'Body' } });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('sent');
    expect(fcm.send).toHaveBeenCalledWith('fcm-token', 'Test', 'Body');
  });

  it('should send Webpush notification successfully', async () => {
    authFns.findUser.mockResolvedValue({ id: '1', pnToken: '{"endpoint":"test"}' });
    webpush.send.mockResolvedValue({ success: true });

    const res = await request(app)
      .post('/send/1')
      .send({ mode: 'Webpush', data: { title: 'Test', body: 'Body' } });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('sent');
    expect(webpush.send).toHaveBeenCalled();
  });

  it('should return 404 when user not found', async () => {
    authFns.findUser.mockResolvedValue(null);

    const res = await request(app)
      .post('/send/1')
      .send({ mode: 'FCM', data: { title: 'Test', body: 'Body' } });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('no user or token');
  });

  it('should return 500 on send error', async () => {
    authFns.findUser.mockResolvedValue({ id: '1', pnToken: 'token' });
    fcm.send.mockRejectedValue(new Error('FCM error'));

    const res = await request(app)
      .post('/send/1')
      .send({ mode: 'FCM', data: { title: 'Test', body: 'Body' } });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});