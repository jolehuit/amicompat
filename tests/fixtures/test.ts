// TypeScript test file with modern features
interface User {
  id: number;
  name?: string;
  profile?: {
    avatar?: string;
    bio?: string;
  };
}

type Result<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

class UserService {
  #apiKey: string;
  #cache = new Map<number, User>();

  constructor(apiKey: string) {
    this.#apiKey = apiKey;
  }

  async getUser(id: number): Promise<Result<User>> {
    const cached = this.#cache.get(id);
    if (cached) {
      return { success: true, data: cached };
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        headers: { 'Authorization': `Bearer ${this.#apiKey}` }
      });

      if (!response.ok) {
        return { success: false, error: 'User not found' };
      }

      const user: User = await response.json();
      this.#cache.set(id, user);

      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
  }

  getUserDisplayName(user: User): string {
    return user.profile?.bio ?? user.name ?? `User ${user.id}`;
  }
}

// Top-level await
const service = new UserService(await getApiKey());
const userResult = await service.getUser(123);