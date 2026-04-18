
const coverPool = [
  "/Destinations/Des1.jpeg",
  "/Destinations/Des2.jpg",
  "/Destinations/Des3.webp",
  "/Destinations/Des4.jpeg",
  "/Destinations/Des5.jpeg",
  "/Destinations/Des6.webp",
  "/Destinations/Des7.jpeg",
];

export interface GroupMember {
  id: string;
  name: string;
  avatarColor: string;
  role: "host" | "co-host" | "member";
  expertise: string;
}

export interface Badge {
  label: string;
  theme: "emerald" | "amber" | "sky" | "rose" | string;
}

export interface HostProfile {
  id: string;
  name?: string;
  handle: string;
  verificationLevel: string;
  pastTripsHosted: number;
  testimonials: string[];
  bio: string;
  avatarColor: string;
}

export interface BackpackerGroup {
  id: string;
  groupName: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  maxMembers: number;
  avgBudget: number;
  budgetRange: string;
  pickupLocation: string;
  accommodationType: string;
  approvalCriteria: {
    minAge: number;
    genderPreference: "any" | "male" | "female";
    trekkingExperience: "beginner" | "intermediate" | "advanced";
    mandatoryRules: string[];
  };
  plan: {
    overview: string;
    itinerary: string[];
    activities: string[];
    estimatedCosts: Record<string, number>;
  };
  tripType: "trek" | "bike" | "cultural" | "wellness" | string;
  tripSource?: "community" | "hosted";
  bikerRequirements?: {
    licenseRequired: boolean;
    ridingGearRequired: boolean;
    speedRules: string;
  };
  documentsRequired: {
    aadhaar: boolean;
    passport: boolean;
    emergencyContact: boolean;
  };
  creatorId: string;
  currentMembers: number;
  coverImage: string;
  members: GroupMember[];
  hostProfile: HostProfile;
  badges: Badge[];
  requests: JoinRequest[];
}

export interface GroupDetail {
  id: string;
  groupName: string;
  destination: string;
  coverImage: string;
  tripWindow: string;
  pickupLocation: string;
  accommodationType: string;
  duration: number;
  budgetRange: string;
  currentMembers: number;
  maxMembers: number;
  tripType: BackpackerGroup["tripType"];
  approvalCriteria: BackpackerGroup["approvalCriteria"];
  documentsRequired: BackpackerGroup["documentsRequired"];
  plan: BackpackerGroup["plan"];
  host: {
    id: string;
    handle: string;
    verificationLevel: string;
    pastTripsHosted: number;
    testimonials: string[];
    bio: string;
    avatarColor: string;
  };
  badges: Badge[];
  members: GroupMember[];
  comments: GroupComment[];
  requests: JoinRequest[];
}

export interface GroupComment {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  avatarColor: string;
  text: string;
  createdAt: string;
  likes: number;
  roleLabel?: string;
}

export type JoinRequestStatus = "pending" | "approved" | "rejected";

export interface JoinRequest {
  id: string;
  groupId: string;
  userId: string;
  status: JoinRequestStatus;
  createdAt: string;
  userName?: string;
  note?: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export const backpackerGroups: BackpackerGroup[] = [];

// Comments are now stored in MongoDB via the BackpackerGroup.comments field

export const joinRequests: JoinRequest[] = [];

export const groupMessages: GroupMessage[] = [];

export function getGroupById(id: string) {
  return backpackerGroups.find((group) => group.id === id) ?? null;
}

const formatTripWindow = (startDate: string, endDate: string) => {
  const formatter = new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" });
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${formatter.format(start)} – ${formatter.format(end)}`;
};

export async function getGroupDetail(id: string): Promise<GroupDetail | null> {
  try {
    // Fetch group from MongoDB via API route
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/backpackers/group/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Prevent caching for fresh data
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch group: ${response.status}`);
    }

    const { group } = await response.json();

    if (!group) {
      return null;
    }

    return {
      id: group.id,
      groupName: group.groupName,
      destination: group.destination,
      coverImage: group.coverImage,
      tripWindow: formatTripWindow(group.startDate, group.endDate),
      pickupLocation: group.pickupLocation,
      accommodationType: group.accommodationType,
      duration: group.duration,
      budgetRange: group.budgetRange,
      currentMembers: group.currentMembers,
      maxMembers: group.maxMembers,
      tripType: group.tripType,
      approvalCriteria: group.approvalCriteria,
      documentsRequired: group.documentsRequired,
      plan: group.plan,
      host: {
        id: group.hostProfile.id,
        handle: group.hostProfile.handle,
        verificationLevel: group.hostProfile.verificationLevel,
        pastTripsHosted: group.hostProfile.pastTripsHosted,
        testimonials: group.hostProfile.testimonials,
        bio: group.hostProfile.bio,
        avatarColor: group.hostProfile.avatarColor,
      },
      badges: group.badges,
      members: group.members,
      comments: group.comments || [],
      requests: group.requests || [],
    };
  } catch (error) {
    console.error('Error fetching group detail:', error);
    return null;
  }
}

export function listGroups() {
  return backpackerGroups;
}

export function listMessagesByGroup(groupId: string) {
  return groupMessages.filter((message) => message.groupId === groupId);
}

// Comment functions moved to server-side only to avoid Mongoose client-side import issues
// These functions are now handled directly in the CommentSection component via fetch calls

export interface CreateGroupPayload {
  groupName: string;
  destination: string;
  startDate: string;
  endDate: string;
  maxMembers: number;
  budgetRange: string;
  pickupLocation: string;
  accommodationType: string;
  minAge: number;
  genderPreference: "any" | "male" | "female";
  trekkingExperience: "beginner" | "intermediate" | "advanced";
  mandatoryRules: string[];
  planOverview: string;
  itinerary: string[];
  activities: string[];
  estimatedCosts: Record<string, number>;
  tripType: string;
  tripSource?: "community" | "hosted";
  creatorId?: string;
}

export async function createBackpackerGroup(payload: CreateGroupPayload) {
  const start = new Date(payload.startDate);
  const end = new Date(payload.endDate);
  const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const totalCost = Object.values(payload.estimatedCosts).reduce((sum, value) => sum + value, 0);
  const id = payload.groupName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .concat("-", Date.now().toString(36));

  const creatorId = payload.creatorId ?? "user_host";

  // Fetch actual user name from database instead of using email
  let actualUserName = creatorId;
  let userDisplayName = creatorId;

  try {
    // Import the getUser function dynamically to avoid circular dependencies
    const { getUser } = await import('../lib/mongodbUtils');
    const user = await getUser(creatorId);

    if (user && user.name) {
      actualUserName = user.name;
      userDisplayName = user.name;
    } else {
      console.log(`⚠️ User not found or no name available for email: ${creatorId}, falling back to email`);
      actualUserName = creatorId;
      userDisplayName = creatorId;
    }
  } catch (error) {
    console.error(`❌ Failed to fetch user data for ${creatorId}:`, error);
    // Fallback to using the email as name
    actualUserName = creatorId;
    userDisplayName = creatorId;
  }

  const hostMember: GroupMember = {
    id: creatorId,
    name: actualUserName,
    avatarColor: "#34d399",
    role: "host",
    expertise: "Trip curator",
  };

  const hostProfile: HostProfile = {
    id: creatorId,
    name: userDisplayName,
    handle: `@${actualUserName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")}`,
    verificationLevel: "Pending verification",
    pastTripsHosted: 0,
    testimonials: [],
    bio: "Host will update their bio soon.",
    avatarColor: hostMember.avatarColor,
  };

  const defaultBadges: Badge[] = [
    { label: "Community beta", theme: "emerald" },
    { label: `${payload.tripType ?? "trip"} crew`, theme: "sky" },
  ];

  const newGroup: BackpackerGroup = {
    id,
    groupName: payload.groupName,
    destination: payload.destination,
    startDate: payload.startDate,
    endDate: payload.endDate,
    duration,
    maxMembers: payload.maxMembers,
    avgBudget: totalCost,
    currentMembers: 1,
    budgetRange: payload.budgetRange,
    pickupLocation: payload.pickupLocation,
    accommodationType: payload.accommodationType,
    approvalCriteria: {
      minAge: payload.minAge,
      genderPreference: payload.genderPreference,
      trekkingExperience: payload.trekkingExperience,
      mandatoryRules: payload.mandatoryRules,
    },
    plan: {
      overview: payload.planOverview,
      itinerary: payload.itinerary,
      activities: payload.activities,
      estimatedCosts: payload.estimatedCosts,
    },
    tripType: payload.tripType,
    documentsRequired: {
      aadhaar: true,
      passport: false,
      emergencyContact: true,
    },
    creatorId,
    coverImage: coverPool[Math.floor(Math.random() * coverPool.length)],
    members: [hostMember],
    hostProfile,
    badges: defaultBadges,
    requests: [],
  };

  // Note: MongoDB operations are now handled server-side via API routes
  // The createBackpackerGroup function should only be called from server-side contexts
  // For client-side usage, use the API route at /api/groups instead

  // Add to memory for backward compatibility (client-side usage)
  backpackerGroups.push(newGroup);
  return newGroup;
}

export function requestToJoinGroup({
  groupId,
  userId,
  userName,
  note,
}: {
  groupId: string;
  userId: string;
  userName?: string;
  note?: string;
}) {
  const request: JoinRequest = {
    id: `req_${Date.now().toString(36)}`,
    groupId,
    userId,
    status: "pending",
    createdAt: new Date().toISOString(),
    userName,
    note,
  };
  joinRequests.push(request);
  return request;
}

export async function handleJoinApproval(requestId: string, status: Exclude<JoinRequestStatus, "pending">) {
  const request = joinRequests.find((item) => item.id === requestId);
  if (!request) return null;
  request.status = status;
  if (status === "approved") {
    const group = backpackerGroups.find((g) => g.id === request.groupId);
    if (group && group.currentMembers < group.maxMembers) {
      group.currentMembers += 1;

      // Fetch actual user name from database instead of using userId
      let actualUserName = request.userId;

      try {
        // Import the getUser function dynamically to avoid circular dependencies
        const { getUser } = await import('../lib/mongodbUtils');
        const user = await getUser(request.userId);

        if (user && user.name) {
          actualUserName = user.name;
        } else {
          console.log(`⚠️ User not found or no name available for email: ${request.userId}, falling back to email`);
          actualUserName = request.userId;
        }
      } catch (error) {
        console.error(`❌ Failed to fetch user data for ${request.userId}:`, error);
        // Fallback to using the userId as name
        actualUserName = request.userId;
      }

      group.members.push({
        id: request.userId,
        name: actualUserName,
        avatarColor: "#c084fc",
        role: "member",
        expertise: "Explorer",
      });
    }
  }
  return request;
}

export function sendMessageToGroup(groupId: string, sender: { id: string; name: string; text: string }) {
  const message: GroupMessage = {
    id: `msg_${Date.now().toString(36)}`,
    groupId,
    senderId: sender.id,
    senderName: sender.name,
    text: sender.text,
    timestamp: new Date().toISOString(),
  };
  groupMessages.push(message);
  return message;
}
