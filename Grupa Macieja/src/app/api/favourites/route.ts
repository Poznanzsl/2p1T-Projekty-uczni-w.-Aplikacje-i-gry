import { type NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getUserFavourites, setUserFavourites } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub;
    const favourites = await getUserFavourites(userId);

    return NextResponse.json({
      favourites: favourites || [],
    });
  } catch (error) {
    console.error("Error fetching favourites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth0.getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub;

    // Parse the request body
    const body = await request.json();
    const { favourites } = body;

    // Validate that favourites is an array of strings
    if (
      !Array.isArray(favourites) ||
      !favourites.every((item) => typeof item === "string")
    ) {
      return NextResponse.json(
        { error: "Favourites must be an array of strings (game IDs)" },
        { status: 400 }
      );
    }

    // Update user's favourites
    await setUserFavourites(userId, favourites);

    return NextResponse.json({
      success: true,
      favourites,
    });
  } catch (error) {
    console.error("Error updating favourites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
