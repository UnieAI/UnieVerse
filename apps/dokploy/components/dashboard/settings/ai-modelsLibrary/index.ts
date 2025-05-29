

export interface ModelData_Payload {
    name: string,
    img_src: string,
    provider: string,
    description: string,
    marker: marker,
    cost: string,
    tokens: string,
}

export enum marker {
    Text = "Text",
    Text2Image = "Text2Image",
    TTS = "TTS",
    STT = "STT",
    Embedding = "Embedding",
    Custom = "Custom",
}