import { NextRequest } from 'next/server';
import { UserService } from '@/services/userService';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return UserService.handleGetUserById(request, { params });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return UserService.handleUpdateUser(request, { params });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return UserService.handlePartialUpdateUser(request, { params });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return UserService.handleDeleteUser(request, { params });
}