import { type NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import {
  getUserGameData,
  setUserGameData,
  deleteUserGameData,
  getUserGameKeys,
} from "@/lib/database";

// GET /api/game-data?gameId=xxx&key=yyy
// GET /api/game-data?gameId=xxx (get all keys for game)
export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub;
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const key = searchParams.get("key");

    if (!gameId) {
      return NextResponse.json(
        { error: "gameId parameter is required" },
        { status: 400 }
      );
    }

    if (key) {
      // Get specific key
      const value = await getUserGameData(userId, gameId, key);
      return NextResponse.json({
        key,
        value: value || null,
      });
    } else {
      // Get all keys for the game
      const allData = await getUserGameKeys(userId, gameId);
      return NextResponse.json({
        gameId,
        data: allData || {},
      });
    }
  } catch (error) {
    console.error("Error fetching game data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/game-data
// Body: { gameId: string, key: string, value: any }
export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub;
    const body = await request.json();
    const { gameId, key, value } = body;

    if (!gameId || !key) {
      return NextResponse.json(
        { error: "gameId and key are required" },
        { status: 400 }
      );
    }

    if (typeof key !== "string" || typeof gameId !== "string") {
      return NextResponse.json(
        { error: "gameId and key must be strings" },
        { status: 400 }
      );
    }

    await setUserGameData(userId, gameId, key, value);

    return NextResponse.json({
      success: true,
      gameId,
      key,
      value,
    });
  } catch (error) {
    console.error("Error saving game data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/game-data?gameId=xxx&key=yyy
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth0.getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub;
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const key = searchParams.get("key");

    if (!gameId || !key) {
      return NextResponse.json(
        { error: "gameId and key parameters are required" },
        { status: 400 }
      );
    }

    await deleteUserGameData(userId, gameId, key);

    return NextResponse.json({
      success: true,
      gameId,
      key,
    });
  } catch (error) {
    console.error("Error deleting game data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
