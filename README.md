<div align="center">
  <br/>
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version 1.0.0"/>
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License"/>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"/>
  <img src="https://img.shields.io/badge/Node-24-339933?logo=node.js&logoColor=white" alt="Node 24"/>
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS 11"/>
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white" alt="Next.js 16"/>
  <img src="https://img.shields.io/badge/React%20Native-0.85-61DAFB?logo=react&logoColor=white" alt="React Native 0.85"/>
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white" alt="MongoDB 7"/>
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis 7"/>

  <!-- Title -->
  <img src="web/public/whisper-responsive/chat-icon.svg" alt="Whisper" width="80"/>

  # Whisper
  
  ### A full-stack, real-time messaging platform
  
  **Modern chat application built with NestJS, Next.js, React Native, and Socket.IO**
  
  <br/>
  <p>
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-screenshots">Screenshots</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-api-overview">API</a> •
    <a href="#-real-time-events">Events</a>
  </p>
  <br/>
</div>

---

## Highlights

| | |
|---|---|
| ⚡ **Real-Time** | Instant messaging via Socket.IO with typing indicators, read receipts, and presence |
| 🎨 **Multi-Platform** | Web (Next.js) + Mobile (Expo/React Native) sharing one API |
| 🔐 **Secure** | JWT with refresh token rotation, httpOnly cookies, bcrypt hashing, rate limiting |
| 📱 **Push Notifications** | Expo Push Notifications with smart suppression when active |
| 🗂️ **File Sharing** | Image, video, voice, document uploads via Cloudinary |
| 👥 **Groups** | Full group management with roles (owner, admin, member) |
| 🌙 **Theming** | 6 DaisyUI themes on web, system-aware dark mode on mobile |
| 🐳 **Containerized** | Docker Compose for both dev and production |

---

## Screenshots

<details>
<summary><strong>Web Application</strong></summary>
<br/>

| | |
|---|---|
| **Onboarding** | ![Onboarding](web/public/screenshots/onboarding.png) |
| **Chat Area** | ![Chat](web/public/screenshots/chat-area-with-a-user.png) |
| **Group Chat** | ![Group Chat](web/public/screenshots/chat-area-with-a-group.png) |
| **Create Conversation** | ![New Conversation](web/public/screenshots/create-private-conversation-modal.png) |
| **Create Group** | ![New Group](web/public/screenshots/create-group-conversation-modal.png) |
| **Notifications** | ![Notifications](web/public/screenshots/notifications.png) |
| **Search** | ![Search](web/public/screenshots/search-feature.png) |
| **Profile** | ![Profile](web/public/screenshots/profile-page.png) |
| **Settings** | ![Settings](web/public/screenshots/settings-page.png) |
| **Themes** | ![Themes](web/public/screenshots/different-themes.png) |

</details>

<details>
<summary><strong>Mobile Application</strong></summary>
<br/>

| | |
|---|---|
| **Onboarding** | ![Onboarding](mobile/assets/images/screenshots/whisper-onboarding.jpg) |
| **Login** | ![Login](mobile/assets/images/screenshots/login-screen.jpg) |
| **Sign Up** | ![Signup](mobile/assets/images/screenshots/signup-screen.jpg) |
| **Chats List** | ![Chats](mobile/assets/images/screenshots/chats-tab.jpg) |
| **Private Chat** | ![Private Chat](mobile/assets/images/screenshots/private-chat-tab.jpg) |
| **Group Chat** | ![Group Chat](mobile/assets/images/screenshots/group-chat-tab.jpg) |
| **Attachment Sheet** | ![Attachment](mobile/assets/images/screenshots/chat-area-attachment-sheet.jpg) |
| **Notifications** | ![Notifications](mobile/assets/images/screenshots/notifications-screen.jpg) |
| **Group Info** | ![Group Info](mobile/assets/images/screenshots/gorup-info-sheet.jpg) |
| **User Profile** | ![User Profile](mobile/assets/images/screenshots/user-profile-sheet.jpg) |
| **Settings** | ![Settings](mobile/assets/images/screenshots/settings-screen.jpg) |
| **Blocked Users** | ![Blocked](mobile/assets/images/screenshots/blocked-users-screen.jpg) |
| **Light Mode (Login)** | ![Login Light](mobile/assets/images/screenshots/login-screen-light-mode.jpg) |
| **Light Mode (Settings)** | ![Settings Light](mobile/assets/images/screenshots/settings-screen-light-mode.jpg) |

</details>

---

## Tech Stack

### Backend

[![My Skills](https://skillicons.dev/icons?i=nestjs,nodejs,ts,mongodb,redis,express,docker,sentry&perline=20)](https://skillicons.dev)

<div>
  <code>NestJS 11</code>&nbsp;
  <code>Node.js 24</code>&nbsp;
  <code>TypeScript 5</code>&nbsp;
  <code>MongoDB 7 + Mongoose 9</code>&nbsp;
  <code>Redis 7</code>&nbsp;
  <code>Socket.IO 4</code>&nbsp;
  <code>JWT + Passport</code>&nbsp;
  <code>Cloudinary</code>&nbsp;
  <code>Pino Logger</code>&nbsp;
  <code>Swagger</code>&nbsp;
  <code>Helmet</code>
</div>

### Web

[![My Skills](https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,sentry,vercel&perline=20)](https://skillicons.dev)

<div>
  <code>Next.js 16 + React 19</code>&nbsp;
  <code>TanStack Query 5</code>&nbsp;
  <code>Zustand 5</code>&nbsp;
  <code>Zod 4</code>&nbsp;
  <code>DaisyUI 5</code>&nbsp;
  <code>Framer Motion</code>&nbsp;
  <code>React Hook Form</code>&nbsp;
  <code>Socket.IO Client</code>
</div>

### Mobile

[![My Skills](https://skillicons.dev/icons?i=react,ts,tailwind&perline=20)](https://skillicons.dev)

<div>
  <code>Expo SDK 56</code>&nbsp;
  <code>React Native 0.85</code>&nbsp;
  <code>NativeWind 5</code>&nbsp;
  <code>Expo Router</code>&nbsp;
  <code>FlashList</code>&nbsp;
  <code>Gorhom Bottom Sheet</code>&nbsp;
  <code>Reanimated 4</code>&nbsp;
  <code>expo-notifications</code>
</div>

### Infrastructure & Tooling

[![My Skills](https://skillicons.dev/icons?i=docker,nginx,pnpm,bun,githubactions,git,linux&perline=20)](https://skillicons.dev)

<div>
  <code>Docker Compose</code>&nbsp;
  <code>Nginx</code>&nbsp;
  <code>Jest</code>&nbsp;
  <code>ESLint</code>&nbsp;
  <code>Prettier</code>&nbsp;
  <code>MongoDB Atlas</code>&nbsp;
  <code>Upstash Redis</code>&nbsp;
  <code>Render</code>&nbsp;
  <code>Sentry</code>
</div>

---

## Architecture

### High-Level Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│              │    │              │    │              │
│   Web App    │    │  Mobile App  │    │  External    │
│  (Next.js)   │    │  (Expo/RN)   │    │  Services    │
│              │    │              │    │              │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       │    HTTP/REST      │    HTTP/REST      │
       │    + WebSocket    │    + WebSocket    │
       ▼                   ▼                   │
┌──────────────────────────────────────────┐   │
│              Nginx (Prod)                │   │
│         Reverse Proxy / Load Balancer    │   │
└────────────────────┬─────────────────────┘   │
                     │                         │
          ┌──────────┴──────────┐              │
          │                     │              │
          ▼                     ▼              ▼
   ┌─────────────┐    ┌────────────────┐  ┌──────────┐
   │  Next.js    │    │   NestJS API   │  │Cloudinary│
   │  SSR Server │    │   (Backend)    │  │  Uploads │
   └─────────────┘    └───────┬────────┘  └──────────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              ┌─────────┐┌────────┐┌──────┐
              │ MongoDB ││ Redis  ││ SMTP │
              │ (Atlas) ││(Uptash)││(Mail)│
              └─────────┘└────────┘└──────┘
```

### Request Lifecycle

```
Client → Nginx (Prod) / Direct (Dev)
  → Request Parsing (Helmet, Cookie Parser, CORS)
  → Pino HTTP Logger
  → Rate Limiter (ThrottlerGuard via Redis)
  → JWT Authentication (Passport Strategy)
  → Route Handler (Controller)
  → Validation (DTO + class-validator)
  → Business Logic (Service)
  → Database Query (Mongoose) / Cache (Redis)
  → Event Emission (EventEmitter2)
  → Response Interceptor ({ success, data, message })
  → Socket Emission (GatewayService)
  → Client
```

### Authentication Flow

```
┌────────┐     ┌──────────┐     ┌──────────┐     ┌────────────┐
│ Client │     │  Server  │     │ MongoDB  │     │   Redis    │
└───┬────┘     └────┬─────┘     └────┬─────┘     └─────┬──────┘
    │                │                │                  │
    │  POST /login   │                │                  │
    │────────────────>│                │                  │
    │                │  Find User     │                  │
    │                │───────────────>│                  │
    │                │<───────────────│                  │
    │                │                │                  │
    │                │  Verify bcrypt │                  │
    │                │  hash          │                  │
    │                │                │                  │
    │                │  Generate JWT  │                  │
    │                │  access+refresh│                  │
    │                │                │                  │
    │                │  Hash + Store  │                  │
    │                │  refresh token │                  │
    │                │───────────────>│                  │
    │                │                │                  │
    │  Set httpOnly  │                │                  │
    │  cookies +     │                │                  │
    │  JSON response │                │                  │
    │<────────────────│                │                  │
    │                │                │                  │
    │  Auto-refresh: │                │                  │
    │  POST /refresh │                │                  │
    │  (cookies)     │                │                  │
    │────────────────>│                │                  │
    │                │  bcrypt-compare│                  │
    │                │  old token     │                  │
    │                │───────────────>│                  │
    │                │<───────────────│                  │
    │                │                │                  │
    │                │  Issue new     │                  │
    │                │  token pair    │                  │
    │                │  (rotation)    │                  │
    │                │                │                  │
    │  New cookies   │                │                  │
    │<────────────────│                │                  │
```

### Socket Flow

```
┌──────┐                              ┌──────┐
│Client│                              │Server│
└──┬───┘                              └──┬───┘
   │  connect(auth: { token })           │
   │─────────────────────────────────────>│
   │                                      │  Validate JWT
   │           connected(userId)          │  Load conversations
   │<═════════════════════════════════════│  Auto-join rooms
   │                                      │
   │  join:conversation({ conversationId })│
   │─────────────────────────────────────>│
   │                                      │  Join Socket.IO room
   │                                      │
   │  typing:start({ conversationId })   │
   │─────────────────────────────────────>│
   │  (rate-limited: 2s)                  │
   │                                      │  Broadcast to room
   │           user:typing(data)          │  (exclude sender)
   │<═════════════════════════════════════│
   │                                      │
   │  message:read({ conversationId })   │
   │─────────────────────────────────────>│
   │  (rate-limited: 1s)                  │  Mark read in DB
   │                                      │  Emit to room
   │           messages:read(data)        │
   │<═════════════════════════════════════│
```

### Notification & Push Notification Flow

```
EventEmitter2 Event
  │
  ▼
NotificationListener
  │
  ├──► GatewayService.shouldSuppressPush()
  │      │
  │      ├── ALL user sockets viewing same conversation? → SKIP push
  │      └── Any socket elsewhere? → SEND push
  │
  ├──► NotificationService.create()
  │      │
  │      └──► GatewayService.emitToUser('notification:new')
  │             │
  │             └──► Socket.IO → Client (in-app notification)
  │
  └──► PushService.sendPushToUser()
         │
         ├──► Expo Push API (https://exp.host/--/api/v2/push/send)
         │      │
         │      ├── Success → update badge count
         │      └── DeviceNotRegistered → clean up token
         │
         └──► Mobile Device (push notification)
```

### Media Upload Flow

```
Client picks file (image/video/audio/document)
  │
  ├── Mobile: expo-image-picker / expo-document-picker / expo-audio
  └── Web: File input / react-dropzone
  │
  ▼
Multer (FileInterceptor) validates:
  │  - File type (allowed MIME types)
  │  - File size (2MB avatars, 10MB messages)
  │
  ▼
UploadService → CloudinaryService
  │  - Streams to Cloudinary via buffer
  │  - Folder: whisper/{type}s/{year}/{month}/
  │  - Returns: { url, publicId, resourceType }
  │
  ▼
Store URL + publicId in database
  │
  ▼
Message: Broadcast via Socket.IO to conversation room
Avatar: Return URL in API response
```

---

## Features

### Feature Matrix

| Category | Feature | Web | Mobile | Backend |
|---|---|---|---|---|
| **Auth** | Email/password registration | ✅ | ✅ | ✅ |
| | JWT access + refresh tokens | ✅ | ✅ | ✅ |
| | httpOnly cookie support | ✅ | ❌ (Bearer) | ✅ |
| | Secure token storage | ✅ (cookies) | ✅ (SecureStore) | ✅ |
| | Auto token refresh with queue | ✅ | ✅ | ✅ |
| | Rate-limited auth endpoints | ✅ | ✅ | ✅ |
| | Email domain restriction | ✅ | ✅ | ✅ |
| **Conversations** | Private 1:1 chat | ✅ | ✅ | ✅ |
| | Group chat | ✅ | ✅ | ✅ |
| | Conversation search | ✅ | ✅ | ✅ |
| | Auto-dedup for existing chats | ✅ | ✅ | ✅ |
| | Paginated conversation list | ✅ | ✅ | ✅ |
| **Groups** | Create with avatar & name | ✅ | ✅ | ✅ |
| | Add/remove participants | ✅ | ✅ | ✅ |
| | Promote/demote admins | ✅ | ✅ | ✅ |
| | Transfer ownership | ✅ | ✅ | ✅ |
| | Delete group (owner only) | ✅ | ✅ | ✅ |
| | Leave group | ✅ | ✅ | ✅ |
| | Role badges (Owner/Admin) | ✅ | ✅ | ✅ |
| **Messaging** | Text messages (4000 char) | ✅ | ✅ | ✅ |
| | Image sharing | ✅ | ✅ | ✅ |
| | Video sharing | ✅ | ✅ | ✅ |
| | Voice messages | ✅ | ✅ | ✅ |
| | File sharing (PDF, TXT) | ✅ | ✅ | ✅ |
| | Reply to messages | ✅ | ✅ | ✅ |
| | Edit messages | ✅ | ✅ | ✅ |
| | Delete messages (soft-delete) | ✅ | ✅ | ✅ |
| | Emoji picker | ✅ | ❌ | - |
| | Message search | ✅ | ❌ | - |
| **Attachments** | Camera capture | - | ✅ | - |
| | Photo library picker | ✅ | ✅ | - |
| | Document picker | ✅ | ✅ | - |
| | Drag & drop | ✅ | - | - |
| | Voice recording | ✅ | ✅ | - |
| | Attachment preview before send | ✅ | ✅ | - |
| | Cloudinary upload | - | - | ✅ |
| **Real-time** | Instant message delivery | ✅ | ✅ | ✅ |
| | Typing indicators | ✅ | ✅ | ✅ |
| | Read receipts | ✅ | ✅ | ✅ |
| | Online/offline presence | ✅ | ✅ | ✅ |
| | Last seen timestamps | ✅ | ✅ | ✅ |
| | Delivery status | ✅ | ✅ | ✅ |
| **Notifications** | In-app notification drawer | ✅ | ✅ | ✅ |
| | Unread count badge | ✅ | ✅ | ✅ |
| | Per-conversation unread counts | ✅ | ✅ | ✅ |
| | Mark single read | ✅ | ✅ | ✅ |
| | Mark all read | ✅ | ✅ | ✅ |
| | Delete individual | ✅ | ✅ | ✅ |
| | Delete all | ✅ | ✅ | ✅ |
| | Notification types | ✅ | ✅ | ✅ |
| **Push** | Expo push notifications | - | ✅ | ✅ |
| | Smart suppression (active user) | - | ✅ | ✅ |
| | Multiple device support | - | ✅ | ✅ |
| | Auto token cleanup | - | ✅ | ✅ |
| | Badge count | - | ✅ | ✅ |
| | Android channels | - | ✅ | - |
| | Tap-to-open conversation | - | ✅ | - |
| **Presence** | Socket-based online detection | ✅ | ✅ | ✅ |
| | Batch presence API | ✅ | ✅ | ✅ |
| | Typing user display | ✅ | ✅ | ✅ |
| | Multiple device awareness | ✅ | ✅ | ✅ |
| **Security** | bcrypt password hashing | - | - | ✅ |
| | Refresh token rotation | - | - | ✅ |
| | httpOnly cookies (XSS protection) | ✅ | - | ✅ |
| | Rate limiting (Redis-backed) | - | - | ✅ |
| | Soft-delete accounts | - | - | ✅ |
| | Block/unblock users | ✅ | ✅ | ✅ |
| | Admin/owner message deletion | ✅ | ✅ | ✅ |
| | File type/size validation | ✅ | ✅ | ✅ |
| | Helmet security headers | - | - | ✅ |
| | Email domain whitelist | - | - | ✅ |
| **Mobile** | Expo SDK 56 | - | ✅ | - |
| | NativeWind styling | - | ✅ | - |
| | FlashList performance | - | ✅ | - |
| | Bottom sheets (Gorhom) | - | ✅ | - |
| | Haptic feedback | - | ✅ | - |
| | Network connectivity banner | - | ✅ | - |
| | Offline awareness | - | ✅ | - |
| | System dark mode | - | ✅ | - |
| **Theming** | 6 DaisyUI themes | ✅ | - | - |
| | Dark/Light mode | ✅ | ✅ | - |
| | Persisted preference | ✅ | ✅ | - |
| **Admin** | Delete own account | ✅ | ✅ | ✅ |
| | Block users | ✅ | ✅ | ✅ |
| | Edit profile | ✅ | ✅ | ✅ |
| | Change avatar | ✅ | ✅ | ✅ |

---

## Project Structure

### Root

```
whisper/
├── backend/          # NestJS API server
├── web/              # Next.js web application
├── mobile/           # Expo React Native app
├── nginx/            # Production nginx config
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── .env
```

### Backend (`backend/`)

```
backend/
├── src/
│   ├── main.ts                      # Bootstrap, global pipes/filters/interceptors
│   ├── app.module.ts                # Root module (imports, middleware, config)
│   ├── app.controller.ts            # Health check endpoint
│   ├── auth/                        # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts       # POST register, login, refresh, logout, GET me
│   │   ├── auth.service.ts          # Business logic, token generation
│   │   ├── jwt.strategy.ts          # Passport strategy (Bearer + cookie)
│   │   └── jwt-auth.guard.ts        # Route protection guard
│   ├── user/                        # User management module
│   ├── chat/                        # Messaging & conversations module
│   ├── gateway/                     # WebSocket gateway module
│   │   ├── chat.gateway.ts          # Socket.IO event handlers
│   │   └── gateway.service.ts       # Socket emission + room management
│   ├── notification/                # In-app notification module
│   ├── push/                        # Expo push notification module
│   ├── upload/                      # File upload delegation
│   ├── mail/                        # Email service (welcome emails)
│   ├── health/                      # MongoDB + Redis health checks
│   └── common/                      # Shared code
│       ├── cloudinary/              # Cloudinary upload/delete
│       ├── constants/               # Auth, events, upload constants
│       ├── decorators/              # @CurrentUser() decorator
│       ├── dtos/                    # Request validation DTOs
│       ├── filters/                 # Global exception filter
│       ├── interceptors/            # Response wrapper, client type detection
│       ├── interfaces/              # TypeScript interfaces
│       ├── pipes/                   # Email domain validation
│       ├── schemas/                 # Mongoose schemas (6 models)
│       └── types/                   # TypeScript types
├── seeds/seed.ts                    # Database seeder (40 users, conversations)
├── scripts/                         # E2E test bash scripts
└── test/                            # Jest e2e test config
```

### Web (`web/`)

```
web/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout (Query > Theme > Auth providers)
│   │   ├── page.tsx                  # Landing page
│   │   ├── login/page.tsx            # Login form
│   │   ├── register/page.tsx         # Registration form
│   │   ├── app/layout.tsx            # Auth guard layout
│   │   ├── app/page.tsx              # Main chat shell
│   │   ├── profile/page.tsx          # Profile editing
│   │   └── settings/page.tsx         # Settings (theme, notifications, security)
│   ├── components/
│   │   ├── chat/                     # Chat components (message, header, modals, group)
│   │   ├── common/                   # Avatar, skeleton, error boundary, empty state
│   │   ├── home/                     # Landing page sections
│   │   ├── layout/                   # App shell, sidebar, conversation list, chat area
│   │   ├── notifications/            # Notification drawer & views
│   │   ├── providers/                # Query + Theme providers
│   │   ├── search/                   # Cmd+K command palette
│   │   ├── settings/                 # Blocked users modal
│   │   ├── shared/                   # Confirm dialog, reveal animation
│   │   └── ui/                       # Theme picker
│   ├── hooks/                        # useAuth, useChat, useSocket, useNotifications
│   │   └── socket/                   # Socket event handler sub-modules
│   ├── libs/axios.ts                 # Axios instance with 401 interceptor + refresh queue
│   ├── providers/auth-provider.tsx    # Auth initialization & session recovery
│   ├── services/                     # API clients (auth, chat, user, notification, gateway)
│   ├── socket/socket.manager.ts      # Singleton Socket.IO manager
│   ├── stores/                       # Zustand stores (auth, chat, presence, notification, theme)
│   ├── types/                        # TypeScript types (entities, DTOs, socket events)
│   ├── constants/                    # App-wide constants
│   └── utils/                        # Utility functions
├── public/
│   ├── screenshots/                  # Feature screenshots
│   └── whisper-responsive/           # PWA icons
├── Dockerfile.dev / .prod
├── next.config.ts
└── tailwind.config...
```

### Mobile (`mobile/`)

```
mobile/
├── src/
│   ├── app/                           # Expo Router file-based routing
│   │   ├── _layout.tsx                # Root layout (providers + stack)
│   │   ├── index.tsx                  # Auth redirect
│   │   ├── (auth)/                    # Login, register, onboarding
│   │   ├── (tabs)/                    # Chats, notifications, settings
│   │   ├── chat/[id].tsx              # Chat room
│   │   ├── chat/new.tsx               # New conversation/group
│   │   ├── group/[id]/manage.tsx      # Group management
│   │   ├── group/[id]/add-participants.tsx
│   │   └── profile/                   # Edit profile, user profile, blocked users
│   ├── components/
│   │   ├── chat/                      # Message bubble, composer, attachments, voice
│   │   ├── media/                     # File card, image lightbox
│   │   ├── sheets/                    # Bottom sheets (group info, message actions, user)
│   │   ├── presence/                  # Online dot indicator
│   │   └── ui/                        # Avatar, skeleton, network banner, logo, confirm modal
│   ├── hooks/                         # useAuth, useChat, useSocket, usePushNotifications
│   │   └── socket/                    # Socket event handlers + manager
│   ├── libs/                          # Axios, notifications helper, secure storage, event emitter
│   ├── providers/                     # App providers, auth provider, query provider
│   ├── services/                      # API clients (auth, chat, user, notification, push, gateway)
│   ├── stores/                        # Zustand stores (auth, chat, presence, notification)
│   ├── constants/                     # Config constants
│   ├── types/                         # TypeScript types
│   └── utils/                         # Utility functions, haptics
├── assets/
│   ├── images/screenshots/            # App screenshots
│   └── images/                        # Icons, splash, logos
├── app.json                           # Expo config
├── metro.config.js                    # Metro bundler with NativeWind
├── nativewind-env.d.ts
└── postcss.config.mjs
```

---

## API Overview

Base URL: `/api`

### Auth Endpoints

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| `POST` | `/auth/register` | - | 3/hr | Register new user |
| `POST` | `/auth/login` | - | 3/hr | Login, receive JWT cookies |
| `POST` | `/auth/refresh` | - | - | Refresh access token |
| `POST` | `/auth/logout` | JWT | - | Clear session |
| `GET` | `/auth/me` | JWT | - | Current user info |

### User Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/users` | List users (paginated) |
| `GET` | `/users/me` | Current user profile |
| `GET` | `/users/me/blocked` | Blocked users list |
| `GET` | `/users/:id` | User by ID |
| `PUT` | `/users/me` | Update profile (multipart) |
| `POST` | `/users/:userId/block` | Block user |
| `DELETE` | `/users/:userId/block` | Unblock user |
| `DELETE` | `/users/me` | Delete account (requires password) |

### Chat Endpoints

| Method | Path | Rate Limit | Description |
|--------|------|------------|-------------|
| `GET` | `/chat/unread-counts` | - | Per-conversation unread counts |
| `GET` | `/chat/conversations` | - | List conversations (paginated) |
| `GET` | `/chat/conversations/:id` | - | Conversation detail |
| `GET` | `/chat/messages/:conversationId` | - | Messages (paginated) |
| `POST` | `/chat/conversations` | 5/hr | Create conversation (multipart) |
| `POST` | `/chat/conversations/:id/participants` | - | Add participants |
| `POST` | `/chat/conversations/:id/admins/:userId` | - | Promote to admin |
| `POST` | `/chat/conversations/:id/owner` | - | Transfer ownership |
| `POST` | `/chat/messages` | 10/min | Send message (multipart) |
| `PATCH` | `/chat/conversations/:id` | - | Update conversation |
| `PATCH` | `/chat/messages/:id` | - | Edit message |
| `DELETE` | `/chat/messages/:id` | - | Delete message |
| `DELETE` | `/chat/conversations/:id/participants/:userId` | - | Remove participant |
| `DELETE` | `/chat/conversations/:id/admins/:userId` | - | Demote admin |
| `DELETE` | `/chat/conversations/:id` | - | Delete conversation |

### Notification Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/notification` | List notifications (paginated) |
| `GET` | `/notification/unread-count` | Unread count |
| `PATCH` | `/notification/:id/read` | Mark as read |
| `PATCH` | `/notification/read-all` | Mark all as read |
| `DELETE` | `/notification/:id` | Delete notification |
| `DELETE` | `/notification/all` | Delete all |

### Push Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/push/register` | Register device token |
| `POST` | `/push/unregister` | Unregister device token |
| `POST` | `/push/unregister-all` | Unregister all tokens |
| `GET` | `/push/devices` | List registered devices |

### Gateway Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/gateway/online/:userId` | Check online status |
| `POST` | `/gateway/online/batch` | Batch status check |
| `GET` | `/gateway/stats` | Connection statistics |

---

## Real-Time Events

### Client → Server

| Event | Payload | Rate Limit | Description |
|-------|---------|------------|-------------|
| `join:conversation` | `{ conversationId }` | - | Join conversation room |
| `leave:conversation` | `{ conversationId }` | - | Leave conversation room |
| `conversation:viewing` | `{ conversationId }` | - | User viewing conversation |
| `conversation:stopped_viewing` | - | - | User stopped viewing |
| `typing:start` | `{ conversationId }` | 2s | Typing indicator on |
| `typing:stop` | `{ conversationId }` | - | Typing indicator off |
| `message:read` | `{ conversationId }` | 1s | Mark messages as read |

### Server → Client

| Event | Payload | Trigger |
|-------|---------|---------|
| `connected` | `{ userId }` | Socket auth success |
| `user:online` | `{ userId }` | User connected |
| `user:offline` | `{ userId, lastSeen }` | User disconnected |
| `user:typing` | `{ conversationId, userId, username }` | User typing |
| `user:stop_typing` | `{ conversationId, userId }` | User stopped typing |
| `message:new` | `Message` | Message sent |
| `message:edited` | `{ messageId, content, conversationId }` | Message edited |
| `message:deleted` | `{ messageId, conversationId }` | Message deleted |
| `message:read` | `{ messageId, userId, conversationId }` | Single message read |
| `messages:read` | `{ conversationId, userId }` | Bulk read receipt |
| `conversation:new` | `Conversation` | Conversation created |
| `conversation:updated` | `Conversation` | Conversation updated |
| `conversation:deleted` | `{ conversationId }` | Conversation deleted |
| `conversation:ownership_transferred` | `{ conversationId, newOwnerId }` | Ownership changed |
| `participant:added` | `{ conversationId, participant }` | Participant added |
| `participant:removed` | `{ conversationId, participantId }` | Participant removed |
| `participant:role_changed` | `{ conversationId, participantId, role }` | Role changed |
| `notification:new` | `Notification` | New notification |

---

## Database Schema

### Collections

| Collection | Key Fields | Indexes |
|---|---|---|
| `users` | `username`, `email` (unique), `password` (hashed), `avatarUrl`, `bio`, `blockedUsers[]`, `lastSeen`, `isDeleted` | `{ username: 1 }`, `{ email: 1 }` |
| `conversations` | `type` (private\|group), `participants[]`, `name`, `avatarUrl`, `admins[]`, `owner`, `lastMessage`, `lastMessageAt` | `{ participants: 1, lastMessageAt: -1 }`, `{ type: 1 }` |
| `messages` | `conversationId`, `senderId`, `type`, `content`, `replyTo`, `deliveredTo[]`, `readBy[]`, `edited`, `deleted` | `{ conversationId: 1, createdAt: -1 }`, `{ replyTo: 1 }` |
| `notifications` | `userId`, `type`, `relatedConversation`, `message`, `isRead` | `{ userId: 1, isRead: 1, createdAt: -1 }`, TTL: 30 days |
| `refresh_tokens` | `userId`, `tokenHash`, `expiresAt` | TTL: auto-delete on expiry |
| `device_tokens` | `userId`, `token`, `platform`, `deviceName` | Unique: `{ token: 1 }`, TTL: 90 days |
| `block_records` | `blockerId`, `blockedId` | Unique compound: `{ blockerId: 1, blockedId: 1 }` |

---

## Security

### JWT Architecture

- **Access Token**: Short-lived (15m dev, 30m prod), stored in `whisper_access_token` httpOnly cookie (web) or SecureStore (mobile)
- **Refresh Token**: Long-lived (30 days), stored in `whisper_refresh_token` httpOnly cookie (web) or SecureStore (mobile)
- **Web**: Dual extractor strategy — Bearer header for API calls, httpOnly cookie for page loads, auto-refresh via axios interceptor
- **Mobile**: Bearer token in `Authorization` header via request interceptor; refresh via dedicated endpoint
- **Refresh Rotation**: Old token is bcrypt-compared against stored hashes, then deleted and replaced with new pair
- **Cookie Config**: `httpOnly`, `secure: true` in prod, `sameSite: 'strict'` dev / `'none'` prod

### Token Lifecycle

```
Login/Register → { access_token, refresh_token } → Cookies/SecureStore

Frontend Request → 401? → Axios Interceptor:
  1. Queue the failed request
  2. Call POST /auth/refresh
  3. On success: retry all queued requests
  4. On failure: dispatch auth:logout, redirect to login
```

### Password Security

- **Hashing**: bcrypt with configurable salt rounds (default: 10)
- **Password Policy**: Minimum 8 chars, must include uppercase, lowercase, number, and special character
- **Validation**: Both client-side (zod) and server-side (class-validator)

### Additional Measures

| Measure | Implementation |
|---|---|
| **Rate Limiting** | `@nestjs/throttler` with Redis storage; global limit + per-route overrides |
| **Upload Validation** | Dual validation — Multer middleware + Cloudinary service; 2MB avatar, 10MB files |
| **Email Domain Restriction** | Configurable whitelist via `ALLOWED_EMAIL_DOMAINS` env var |
| **Security Headers** | Helmet middleware (CSP, XSS, frame options, etc.) |
| **CORS** | Explicit origin configuration, credentials enabled |
| **Input Validation** | class-validator decorators on all DTOs, whitelist mode |
| **Error Handling** | Global exception filter — no stack traces in production |
| **Logging** | Pino structured logging with daily rotation (14d info, 30d errors) |
| **Graceful Shutdown** | Mongoose disconnect with 10s timeout safeguard |

---

## Installation

### Prerequisites

- **Node.js** 24+
- **pnpm** 10+ (backend) / **npm** (web)
- **Docker** & **Docker Compose** (recommended for dev)
- **MongoDB** 7+
- **Redis** 7+
- **Expo CLI** (for mobile)

### Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/amirrajj-dev/whisper.git
cd whisper

# Start all services
docker compose -f docker-compose.dev.yml up -d

# Backend: http://localhost:3000
# Frontend: http://localhost:4000
# MongoDB: localhost:27017
# Redis: localhost:6379
```

### Manual Setup

#### Backend

```bash
cd backend

# Copy and configure environment
cp .env.dev .env

# Install dependencies
pnpm install

# Start in dev mode (watch mode)
pnpm run start:dev

# Seed the database (optional)
pnpm run seed
```

#### Web

```bash
cd web

# Copy and configure environment
cp .env.dev .env.local

# Install dependencies
npm install

# Start development server (port 4000)
npm run dev
```

#### Mobile

```bash
cd mobile

# Install dependencies
npm install

# Start Expo
npx expo start

# Scan QR code with Expo Go, or press:
# a - Android emulator
# i - iOS simulator
# w - web browser
```

### Environment Variables

#### Backend

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | 3000 | Server port |
| `MONGO_URL` | Yes | - | MongoDB connection string |
| `REDIS_URL` | Yes | - | Redis connection string |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `ACCESS_TOKEN_EXPIRES_IN` | No | 15m | Access token TTL |
| `REFRESH_TOKEN_EXPIRES_IN` | No | 30d | Refresh token TTL |
| `BCRYPT_SALT_ROUNDS` | No | 10 | bcrypt salt rounds |
| `CORS_ORIGIN` | No | * | CORS origin |
| `THROTTLE_TTL` | No | 60000 | Rate limit window (ms) |
| `THROTTLE_LIMIT` | No | 10 | Rate limit max requests |
| `CLOUDINARY_CLOUD_NAME` | Yes | - | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | - | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | - | Cloudinary API secret |
| `EMAIL_HOST` / `EMAIL_USERNAME` / `EMAIL_PASSWORD` | Yes | - | SMTP config |
| `FRONTEND_URL` | Yes | - | Frontend URL |
| `ALLOWED_EMAIL_DOMAINS` | No | - | Restricted email domains |
| `LOG_LEVEL` | No | info | Pino log level |

#### Web

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO server URL |
| `NEXT_PUBLIC_FRONTEND_URL` | Frontend URL |

#### Mobile

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend API URL |
| `EXPO_PUBLIC_SOCKET_URL` | Socket.IO server URL |

---

## Development

### Running Locally

```bash
# Terminal 1: Backend
cd backend && pnpm run start:dev

# Terminal 2: Web
cd web && npm run dev

# Terminal 3: Mobile
cd mobile && npx expo start
```

### Testing

```bash
# Backend unit tests
cd backend && pnpm test

# Backend with coverage
pnpm test:cov

# Backend end-to-end (requires running server)
pnpm run test:e2e

# E2E bash scripts
pnpm run test:auth
pnpm run test:users
pnpm run test:chat
pnpm run test:notifications
pnpm run test:gateway
# or all at once
pnpm run test:all
```

> **Note**: The web and mobile apps currently do not have test infrastructure.

### Linting

```bash
# Backend
cd backend && pnpm run lint

# Web
cd web && npm run lint

# Mobile
cd mobile && npx expo lint
```

### Seeding

```bash
cd backend
pnpm run seed
# Creates 40 users, 20+ conversations, and sample messages
```

---

## Production

### Deployment

The recommended deployment uses Docker Compose with an nginx reverse proxy:

```bash
# Set your domain
export DOMAIN=https://yourdomain.com

# Start production stack
docker compose -f docker-compose.prod.yml up -d
```

**Production architecture:**

- **Frontend**: Next.js SSR on port 4000
- **Backend**: NestJS API on port 3000
- **Nginx**: Single entry point on port 80, proxies `/api/` and `/socket.io/` to backend, everything else to frontend
- **MongoDB**: External (MongoDB Atlas)
- **Redis**: External (Upstash Redis)
- **File Storage**: Cloudinary

### Environment Requirements

- Node.js 24+
- MongoDB 7+ (Atlas recommended)
- Redis 7+ (Upstash recommended)
- Cloudinary account (for file uploads)
- SMTP server (for welcome emails)
- Expo account (for push notifications)

### Monitoring & Logging

- **Structured Logging**: Pino with daily rotation (14 days info, 30 days errors)
- **Error Tracking**: Sentry integration (configurable via `SENTRY_DSN`)
- **Health Checks**: MongoDB + Redis health via `GET /api/health`
- **Graceful Shutdown**: 10s forced shutdown timeout

---

## Mobile

### Architecture

The mobile app is built with **Expo SDK 56** and **React Native 0.85**, using Expo Router for file-based navigation.

### Push Notifications

- **Service**: Expo Push Notifications
- **Channels**: `messages` (HIGH), `groups` (HIGH), `system` (DEFAULT) — Android only
- **Permissions**: Requested on auth, handled gracefully
- **Badge**: Server-managed badge count based on unread notifications
- **Tap-to-open**: Navigates to the relevant conversation
- **Smart Suppression**: Push is suppressed if ALL user's devices are viewing the same conversation
- **Token Cleanup**: Invalid tokens (DeviceNotRegistered) are auto-removed

### Offline Considerations

- **NetworkBanner**: Red banner when offline via `@react-native-community/netinfo`
- **Optimistic Updates**: Messages appear instantly in the UI before server confirmation; replaced with server response on delivery
- **Token Storage**: All auth tokens persisted in `expo-secure-store` for session recovery

### Platform Support

| Platform | Version | Notes |
|---|---|---|
| **iOS** | 15.0+ | Full support |
| **Android** | 6.0+ | Full support |
| **Web** | Modern browsers | Expo web support |

### Key Libraries

| Purpose | Library |
|---|---|
| Navigation | `expo-router` |
| Styling | `NativeWind 5` / `Tailwind CSS 4` |
| State (server) | `@tanstack/react-query` |
| State (client) | `zustand` |
| Real-time | `socket.io-client` |
| Lists | `@shopify/flash-list` |
| Sheets | `@gorhom/bottom-sheet` |
| Images | `expo-image` |
| Audio | `expo-audio` |
| Haptics | `expo-haptics` |
| Notifications | `expo-notifications` |

---

## Contribution

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Run the tests** (`cd backend && pnpm test`)
5. **Commit** (`git commit -m 'Add amazing feature'`)
6. **Push** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines

- Follow existing code style (Prettier configured for backend)
- Ensure all backend tests pass (`pnpm test`)
- Add tests for new features (backend)
- Update documentation as needed
- Use conventional commit messages

---

## Roadmap

### Current State (v1.0.0)

- ✅ Real-time 1:1 and group messaging
- ✅ Multi-platform (web + mobile)
- ✅ Push notifications with smart suppression
- ✅ File sharing (images, video, voice, documents)
- ✅ Typing indicators and read receipts
- ✅ Online presence and last seen
- ✅ Group management with roles
- ✅ Blocking system
- ✅ Advanced theming (6 themes on web, dark/light on mobile)

### Planned

| Feature | Priority | Status |
|---|---|---|
| **Message Reactions** (emoji reactions on messages) | High | 📝 Planned |
| **Message Search** (full-text search across conversations) | High | 📝 Planned |
| **Voice/Video Calls** (WebRTC integration) | Medium | 📝 Planned |
| **End-to-End Encryption** | High | 🔬 Researching |
| **Web Frontend Tests** (Jest/Vitest + React Testing Library) | High | 📝 Planned |
| **Mobile Tests** (Jest + React Native Testing Library) | Medium | 📝 Planned |
| **CI/CD Pipeline** (GitHub Actions) | Medium | 📝 Planned |
| **Internationalization** (i18n support) | Low | 📝 Planned |
| **Message Forwarding** | Low | 📝 Planned |
| **Read Receipt Details** (per-user read status) | Low | 📝 Planned |
| **Message Pinning** | Low | 📝 Planned |

---

## License

This project is licensed under the MIT License.

---

<div align="center">
  <br/>
  <p>
    Built with ❤️ using <a href="https://nestjs.com">NestJS</a>,
    <a href="https://nextjs.org">Next.js</a>,
    <a href="https://expo.dev">Expo</a>,
    and <a href="https://socket.io">Socket.IO</a>
  </p>
  <p>
    <a href="#whisper">Back to top ▲</a>
  </p>
</div>
