import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/whisper';
const USERS_COUNT = 40;
const CONVERSATIONS_COUNT = 20;
const MESSAGES_PER_CONVERSATION = 15;
const NOTIFICATIONS_PER_USER = 5;

const randomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const randomDate = (start: Date, end: Date): Date =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const generateUsers = async () => {
  const saltRounds = 10;
  const defaultPassword = 'Test@123456';
  const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

  return Array.from({ length: USERS_COUNT }, (_, i) => ({
    username:
      faker.internet.username().toLowerCase().slice(0, 20) + (i > 0 ? i : ''),
    email: faker.internet.email().toLowerCase(),
    password: hashedPassword,
    bio: faker.lorem.sentence({ min: 3, max: 15 }),
    avatarUrl: faker.image.avatar(),
    blockedUsers: [],
    lastSeen: faker.date.recent({ days: 7 }),
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: new Date(),
  }));
};

const generateRefreshTokens = (userIds: mongoose.Types.ObjectId[]) =>
  userIds.slice(0, 20).map((userId) => ({
    userId,
    tokenHash: bcrypt.hashSync(faker.string.uuid(), 10),
    expiresAt: faker.date.future({ years: 1 }),
    createdAt: faker.date.recent({ days: 30 }),
    updatedAt: new Date(),
  }));

const generateConversations = (userIds: mongoose.Types.ObjectId[]) => {
  const conversations: any[] = [];

  for (let i = 0; i < 15; i++) {
    const [user1, user2] = faker.helpers.arrayElements(userIds, 2);
    conversations.push({
      type: 'private',
      participants: [user1, user2],
      name: undefined,
      avatarUrl: undefined,
      admins: [],
      lastMessage: faker.lorem.sentence({ min: 3, max: 10 }),
      lastMessageAt: faker.date.recent({ days: 3 }),
      createdBy: user1,
      createdAt: faker.date.recent({ days: 60 }),
      updatedAt: new Date(),
    });
  }

  for (let i = 0; i < 5; i++) {
    const participants = faker.helpers.arrayElements(
      userIds,
      faker.number.int({ min: 3, max: 10 }),
    );
    const creator = participants[0];
    conversations.push({
      type: 'group',
      participants,
      name: faker.company.name() + ' Group',
      avatarUrl: faker.image.url(),
      admins: [
        creator,
        ...faker.helpers.arrayElements(
          participants.slice(1),
          Math.floor(participants.length / 3),
        ),
      ],
      lastMessage: faker.lorem.sentence({ min: 3, max: 10 }),
      lastMessageAt: faker.date.recent({ days: 2 }),
      createdBy: creator,
      createdAt: faker.date.recent({ days: 90 }),
      updatedAt: new Date(),
    });
  }

  return conversations;
};

const generateMessages = (
  conversations: {
    _id: mongoose.Types.ObjectId;
    participants: mongoose.Types.ObjectId[];
    createdAt: Date;
  }[],
) => {
  const messages: any[] = [];
  const messageTypes = ['text', 'text', 'text', 'image', 'file', 'voice'];

  for (const conv of conversations) {
    const convParticipants = conv.participants;
    const baseDate = conv.createdAt;

    for (let i = 0; i < MESSAGES_PER_CONVERSATION; i++) {
      const senderId =
        convParticipants[Math.floor(Math.random() * convParticipants.length)];
      const type = randomItem(messageTypes);
      let content = '';

      switch (type) {
        case 'text':
          content = faker.lorem.sentence({ min: 3, max: 20 });
          break;
        case 'image':
          content = faker.image.url();
          break;
        case 'file':
          content = faker.system.fileName();
          break;
        case 'voice':
          content = faker.system.filePath() + '.ogg';
          break;
        default:
          content = faker.lorem.sentence({ min: 3, max: 20 });
      }

      const deliveredTo = convParticipants.filter(
        (id) => id.toString() !== senderId.toString(),
      );
      const deliveredCount = faker.number.int({
        min: 0,
        max: deliveredTo.length,
      });

      messages.push({
        conversationId: conv._id,
        senderId,
        type,
        content,
        edited: faker.datatype.boolean({ probability: 0.1 }),
        deleted: faker.datatype.boolean({ probability: 0.05 }),
        deliveredTo: deliveredTo.slice(0, deliveredCount),
        createdAt: randomDate(baseDate, new Date()),
        updatedAt: new Date(),
      });
    }
  }

  return messages;
};

const generateNotifications = (
  userIds: mongoose.Types.ObjectId[],
  conversations: (any & { _id: mongoose.Types.ObjectId })[],
) => {
  const notifications: any[] = [];
  const types = [
    'message',
    'friend_request',
    'mention',
    'reply',
    'reaction',
    'system',
  ];

  for (const userId of userIds.slice(0, 25)) {
    for (let i = 0; i < NOTIFICATIONS_PER_USER; i++) {
      const type = randomItem(types) as string;
      let relatedConversation: mongoose.Types.ObjectId | undefined;
      let message = '';

      if (type === 'message' || type === 'mention' || type === 'reply') {
        const conv = randomItem(conversations);
        if (
          conv.participants.some(
            (p: mongoose.Types.ObjectId) => p.toString() === userId.toString(),
          )
        ) {
          relatedConversation = conv._id;
        }
      }

      const firstName = faker.person.firstName();
      switch (type) {
        case 'message':
          message = faker.helpers.arrayElement([
            'New message received',
            'You have a new message',
            `${firstName} sent you a message`,
          ]);
          break;
        case 'friend_request':
          message = `${firstName} sent you a friend request`;
          break;
        case 'mention':
          message = `${firstName} mentioned you in a group`;
          break;
        case 'reaction':
          message = `${firstName} reacted to your message`;
          break;
        case 'system':
          message = faker.helpers.arrayElement([
            'Welcome to Whisper!',
            'Your account has been verified',
            'New features available',
          ]);
          break;
      }

      notifications.push({
        userId,
        type,
        relatedConversation,
        message,
        isRead: faker.datatype.boolean({ probability: 0.7 }),
        createdAt: faker.date.recent({ days: 30 }),
        updatedAt: new Date(),
      });
    }
  }

  return notifications;
};

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db!;
    const usersCollection = db.collection('users');
    const refreshTokensCollection = db.collection('refresh_tokens');
    const conversationsCollection = db.collection('conversations');
    const messagesCollection = db.collection('messages');
    const notificationsCollection = db.collection('notifications');

    console.log('Clearing existing data...');
    await Promise.all([
      usersCollection.deleteMany({}),
      refreshTokensCollection.deleteMany({}),
      conversationsCollection.deleteMany({}),
      messagesCollection.deleteMany({}),
      notificationsCollection.deleteMany({}),
    ]);

    console.log(`Generating ${USERS_COUNT} users...`);
    const users = await generateUsers();
    const userResult = await usersCollection.insertMany(users);
    const userIds = Object.values(userResult.insertedIds).map(
      (id) => new mongoose.Types.ObjectId(id.toString()),
    );
    console.log(`Inserted ${userIds.length} users`);

    console.log('Generating refresh tokens...');
    const refreshTokens = generateRefreshTokens(userIds);
    const refreshResult =
      await refreshTokensCollection.insertMany(refreshTokens);
    console.log(`Inserted ${refreshResult.insertedCount} refresh tokens`);

    console.log(`Generating ${CONVERSATIONS_COUNT} conversations...`);
    const conversations = generateConversations(userIds);
    const convResult = await conversationsCollection.insertMany(conversations);
    const insertedConvs = Object.values(convResult.insertedIds).map(
      (id, idx) => ({
        ...conversations[idx],
        _id: new mongoose.Types.ObjectId(id.toString()),
      }),
    );
    console.log(`Inserted ${insertedConvs.length} conversations`);

    console.log('Generating messages...');
    const messages = generateMessages(insertedConvs as any);
    const msgResult = await messagesCollection.insertMany(messages);
    console.log(`Inserted ${msgResult.insertedCount} messages`);

    console.log('Generating notifications...');
    const notifications = generateNotifications(userIds, insertedConvs);
    const notifResult = await notificationsCollection.insertMany(notifications);
    console.log(`Inserted ${notifResult.insertedCount} notifications`);

    console.log('\n==================================================');
    console.log('SEEDING COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    console.log('Summary:');
    console.log(`  - Users: ${userIds.length}`);
    console.log(`  - Refresh Tokens: ${refreshResult.insertedCount}`);
    console.log(`  - Conversations: ${insertedConvs.length}`);
    console.log(`  - Messages: ${msgResult.insertedCount}`);
    console.log(`  - Notifications: ${notifResult.insertedCount}`);
    console.log('\nDefault credentials:');
    console.log('  Password: Test@123456');
    console.log('\nTip: Use MongoDB Compass to browse the data');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seed();
