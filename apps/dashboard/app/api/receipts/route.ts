import { NextRequest, NextResponse } from 'next/server';

const PONDER_URL = process.env.PONDER_URL || 'http://localhost:42069';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const strategyId = searchParams.get('strategyId');
  const txHash = searchParams.get('txHash');
  const user = searchParams.get('user');

  try {
    let url = `${PONDER_URL}/receipts`;

    if (strategyId) {
      url = `${PONDER_URL}/receipts/${strategyId}`;
    } else if (txHash) {
      url = `${PONDER_URL}/receipts?txHash=${txHash}`;
    } else if (user) {
      url = `${PONDER_URL}/receipts?user=${user}`;
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch receipts from indexer' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Receipts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}
