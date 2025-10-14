import { NextRequest } from 'next/server';
import { UserService } from '@/services/userService';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const params = await context.params;
  return UserService.handleGetUserById(request, { params });
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const params = await context.params;
  return UserService.handleUpdateUser(request, { params });
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const params = await context.params;
  return UserService.handlePartialUpdateUser(request, { params });
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const params = await context.params;
  return UserService.handleDeleteUser(request, { params });
}