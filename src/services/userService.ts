// src/services/userService.ts
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { 
  UserCreateInput, 
  UserUpdateInput, 
  PaginationOptions,
  UserPublic,
  validateEmail 
} from '@/models/userModel';
import { 
  successResponse, 
  errorResponse, 
  apiErrorHandler 
} from '@/lib/apiUtils';

export class UserService {
  // Récupérer tous les utilisateurs avec pagination et recherche
  static async getUsers(options: PaginationOptions = {}): Promise<{
    users: UserPublic[];
    pagination: {
      total: number;
      pages: number;
      page: number;
      limit: number;
    }
  }> {
    const {
      page = 1,
      limit = 10,
      search = '',
    } = options;
    
    const skip = (page - 1) * limit;
    
    // Construire la condition de recherche pour MongoDB
    const whereCondition: Prisma.UserWhereInput = search
      ? {
          OR: [
            { nom: { contains: search, mode: 'insensitive' } },
            { prenom: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    
    // Récupérer les utilisateurs avec pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({
        where: whereCondition,
      }),
    ]);
    
    // Transformer les utilisateurs en UserPublic
    const publicUsers: UserPublic[] = users.map(user => ({
      ...user,
      fullName: `${user.prenom} ${user.nom}`,
      age: this.calculateAge(user.dateNaissance)
    }));
    
    return {
      users: publicUsers,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    };
  }
  
  // Récupérer un utilisateur par son ID
  static async getUserById(id: string): Promise<UserPublic> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    return {
      ...user,
      fullName: `${user.prenom} ${user.nom}`,
      age: this.calculateAge(user.dateNaissance)
    };
  }
  
  // Créer un nouvel utilisateur
  static async createUser(data: UserCreateInput): Promise<UserPublic> {
    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (existingUser) {
      throw new Error('Cet email est déjà utilisé');
    }

    console.log('======================',data);
    
    // Créer l'utilisateur
 
    const newUser = await prisma.user.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        username: data.username,
        password: data.password,
        isAdmin: Boolean(data.isAdmin),
        dateNaissance: new Date(data.dateNaissance),
      },
    });
    
    return {
      ...newUser,
      fullName: `${newUser.prenom} ${newUser.nom}`,
      age: this.calculateAge(newUser.dateNaissance)
    };
  }
  
  // Mettre à jour un utilisateur
  static async updateUser(id: string, data: UserUpdateInput): Promise<UserPublic> {
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!existingUser) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (data.email && data.email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: data.email },
      });
      
      if (emailInUse) {
        throw new Error('Cet email est déjà utilisé par un autre utilisateur');
      }
    }
    
    // Préparer les données à mettre à jour
    const updateData: Prisma.UserUpdateInput = {};
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.prenom !== undefined) updateData.prenom = data.prenom;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.dateNaissance !== undefined) {
      updateData.dateNaissance = new Date(data.dateNaissance);
    }
    
    // Mise à jour de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    
    return {
      ...updatedUser,
      fullName: `${updatedUser.prenom} ${updatedUser.nom}`,
      age: this.calculateAge(updatedUser.dateNaissance)
    };
  }
  
  // Supprimer un utilisateur
  static async deleteUser(id: string): Promise<void> {
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!existingUser) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id },
    });
  }

  // Méthodes de gestion de requête HTTP

  // Récupérer tous les utilisateurs
  static async handleGetAllUsers(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');
      const page = parseInt(searchParams.get('page') || '1');
      const search = searchParams.get('search') || '';
      
      const result = await this.getUsers({ page, limit, search });
      
      return successResponse(result.users, result.pagination);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  // Créer un nouvel utilisateur
  static async handleCreateUser(request: NextRequest) {
    try {
      const body = await request.json();
      
      // Validation des champs requis
      const requiredFields: (keyof UserCreateInput)[] = ['nom', 'prenom', 'email', 'dateNaissance'];
      const missingFields = requiredFields.filter(field => !body[field]);
      
      if (missingFields.length > 0) {
        return errorResponse(`Champs manquants : ${missingFields.join(', ')}`);
      }
      
      // Validation de l'email
      if (!validateEmail(body.email)) {
        return errorResponse('Format d\'email invalide');
      }

      const hashedPassword = await bcrypt.hash(body.password, 10); 
      
      const userInput: UserCreateInput = {
        nom: body.nom,
        prenom: body.prenom,
        email: body.email,
        dateNaissance: body.dateNaissance,
        username:body.username,
        password: hashedPassword,
        isAdmin: body.isAdmin
      };
      
      const user = await this.createUser(userInput);
      
      return successResponse(user, undefined, 201);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  // Récupérer un utilisateur par ID
  static async handleGetUserById(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const user = await this.getUserById(params.id);
      return successResponse(user);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  // Mettre à jour un utilisateur (mise à jour complète)
  static async handleUpdateUser(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const body = await request.json();
      
      // Validation des champs requis pour une mise à jour complète
      const requiredFields: (keyof UserUpdateInput)[] = ['nom', 'prenom', 'email', 'dateNaissance'];
      const missingFields = requiredFields.filter(field => !body[field]);
      
      if (missingFields.length > 0) {
        return errorResponse(`Champs manquants : ${missingFields.join(', ')}`);
      }
      
      // Validation de l'email
      if (body.email && !validateEmail(body.email)) {
        return errorResponse('Format d\'email invalide');
      }
      
      const updateInput: UserUpdateInput = {
        nom: body.nom,
        prenom: body.prenom,
        email: body.email,
        dateNaissance: body.dateNaissance,
      };
      
      const updatedUser = await this.updateUser(params.id, updateInput);
      
      return successResponse(updatedUser);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  // Mise à jour partielle d'un utilisateur
  static async handlePartialUpdateUser(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const body = await request.json();
      
      // Validation de l'email si fourni
      if (body.email && !validateEmail(body.email)) {
        return errorResponse('Format d\'email invalide');
      }
      
      const updateInput: UserUpdateInput = { ...body };
      
      const updatedUser = await this.updateUser(params.id, updateInput);
      
      return successResponse(updatedUser);
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  // Supprimer un utilisateur
  static async handleDeleteUser(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      await this.deleteUser(params.id);
      
      return successResponse({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      return apiErrorHandler(error);
    }
  }

  // Méthode privée pour calculer l'âge
  private static calculateAge(dateNaissance: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateNaissance.getFullYear();
    const monthDiff = today.getMonth() - dateNaissance.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateNaissance.getDate())) {
      age--;
    }
    
    return age;
  }
}