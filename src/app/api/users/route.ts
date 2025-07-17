// src/app/api/users/route.ts
import { NextRequest } from 'next/server';
import { UserService } from '@/services/userService';

export async function GET(request: NextRequest) {
  return UserService.handleGetAllUsers(request);
}

export async function POST(request: NextRequest) {
  return UserService.handleCreateUser(request);
}

