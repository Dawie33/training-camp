export interface Equipment {
    id: string
    label: string
    slug: string
    description: string | null;
    image_url: string | null;
    created_at: Date;
    updated_at: Date;
    meta: Record<string, string>;
}
