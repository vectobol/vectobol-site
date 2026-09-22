export async function loadCollaborators() {

    const response = await fetch(
        '/wp-json/vectobol/v1/collaborators'
    );

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}`
        );
    }

    return await response.json();

}