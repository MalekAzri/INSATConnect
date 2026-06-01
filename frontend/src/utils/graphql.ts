const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

export async function queryGraphQL(query: string, variables: any = {}) {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const { data, errors } = await res.json();
    if (errors && errors.length > 0) {
      console.error('GraphQL errors:', errors);
      throw new Error(errors[0].message);
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch from GraphQL API:', error);
    throw error;
  }
}
