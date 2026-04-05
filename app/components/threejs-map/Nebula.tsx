"use client";

import * as THREE from "three";
import { useMemo } from "react";
import {
  NEBULA_HUE,
  NEBULA_LIGHTNESS_JITTER,
  NEBULA_SATURATION,
  NEBULA_SPRITE_BASE_SIZE,
  NEBULA_SPRITE_COUNT,
  NEBULA_SPRITE_OPACITY,
  NEBULA_SPRITE_RADIUS,
  NEBULA_SPRITE_Z,
  RADIAL_GRADIENT_TEXTURE_SIZE,
} from "./constants";

function buildRadialGradientTexture(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function buildSprite(
  texture: THREE.Texture,
  color: THREE.Color,
  opacity: number,
  pos: THREE.Vector3,
  size: number,
) {
  const spriteMat = new THREE.SpriteMaterial({
    color,
    fog: true,
    map: texture,
    transparent: true,
    opacity,
  });
  spriteMat.color.offsetHSL(0, 0, Math.random() * NEBULA_LIGHTNESS_JITTER * 2 - NEBULA_LIGHTNESS_JITTER);
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(pos.x, -pos.y, pos.z);
  const jitteredSize = size + Math.random() - 0.5;
  sprite.scale.set(jitteredSize, jitteredSize, jitteredSize);
  sprite.material.rotation = 0;
  return sprite;
}

function buildNebulaGroup(texture: THREE.Texture) {
  const layerGroup = new THREE.Group();
  for (let i = 0; i < NEBULA_SPRITE_COUNT; i += 1) {
    const angle = (i / NEBULA_SPRITE_COUNT) * Math.PI * 2;
    const pos = new THREE.Vector3(
      Math.cos(angle) * Math.random() * NEBULA_SPRITE_RADIUS,
      Math.sin(angle) * Math.random() * NEBULA_SPRITE_RADIUS,
      NEBULA_SPRITE_Z + Math.random(),
    );
    const color = new THREE.Color().setHSL(NEBULA_HUE, 1, NEBULA_SATURATION);
    const sprite = buildSprite(
      texture,
      color,
      NEBULA_SPRITE_OPACITY,
      pos,
      NEBULA_SPRITE_BASE_SIZE,
    );
    layerGroup.add(sprite);
  }
  return layerGroup;
}

export default function Nebula() {
  const sprites = useMemo(() => {
    const texture = buildRadialGradientTexture(RADIAL_GRADIENT_TEXTURE_SIZE);
    return buildNebulaGroup(texture);
  }, []);
  return <primitive object={sprites} />;
}
