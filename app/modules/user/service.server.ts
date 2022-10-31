import type { User } from '~/database';
import { db } from '~/database';
import type { AuthSession } from '~/modules/auth';
import { createEmailAuthAccount, signInWithEmail, deleteAuthAccount } from '~/modules/auth';

export async function getUserByEmail(email: User['email']) {
  return db.user.findUnique({ where: { email: email.toLowerCase() } });
}

async function createUser({ email, userId }: Pick<AuthSession, 'userId' | 'email'>) {
  const nickname = makeNick(7);
  return db.user
    .create({
      data: {
        email,
        id: userId,
        nickname,
      },
    })
    .then((user) => user)
    .catch(() => null);
}

export async function tryCreateUser({ email, userId }: Pick<AuthSession, 'userId' | 'email'>) {
  const user = await createUser({
    userId,
    email,
  });

  // user account created and have a session but unable to store in User table
  // we should delete the user account to allow retry create account again
  if (!user) {
    await deleteAuthAccount(userId);
    return null;
  }

  return user;
}

export async function createUserAccount(email: string, password: string): Promise<AuthSession | null> {
  const authAccount = await createEmailAuthAccount(email, password);

  // ok, no user account created
  if (!authAccount) return null;

  const authSession = await signInWithEmail(email, password);

  // user account created but no session 😱
  // we should delete the user account to allow retry create account again
  if (!authSession) {
    await deleteAuthAccount(authAccount.id);
    return null;
  }

  const user = await tryCreateUser(authSession);

  if (!user) return null;

  return authSession;
}

function makeNick(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
