"use client";

import * as THREE from "three";
import { useMemo } from "react";

const SPRITE_COUNT = 8;
const SPRITE_RADIUS = 10;
const SPRITE_Z = -10.5;
const SPRITE_BASE_SIZE = 24;
const SPRITE_OPACITY = 0.2;
const HUE = 0.65;
const SATURATION = 0.5;
const LIGHTNESS_JITTER = 0.1;
const RADIAL_GRADIENT_SIZE = 256;

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
  spriteMat.color.offsetHSL(
    0,
    0,
    Math.random() * LIGHTNESS_JITTER * 2 - LIGHTNESS_JITTER,
  );
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(pos.x, -pos.y, pos.z);
  const jitteredSize = size + Math.random() - 0.5;
  sprite.scale.set(jitteredSize, jitteredSize, jitteredSize);
  sprite.material.rotation = 0;
  return sprite;
}

function buildNebulaGroup(texture: THREE.Texture) {
  const layerGroup = new THREE.Group();
  for (let i = 0; i < SPRITE_COUNT; i += 1) {
    const angle = (i / SPRITE_COUNT) * Math.PI * 2;
    const pos = new THREE.Vector3(
      Math.cos(angle) * Math.random() * SPRITE_RADIUS,
      Math.sin(angle) * Math.random() * SPRITE_RADIUS,
      SPRITE_Z + Math.random(),
    );
    const color = new THREE.Color().setHSL(HUE, 1, SATURATION);
    const sprite = buildSprite(
      texture,
      color,
      SPRITE_OPACITY,
      pos,
      SPRITE_BASE_SIZE,
    );
    layerGroup.add(sprite);
  }
  return layerGroup;
}

export default function Nebula() {
  const sprites = useMemo(() => {
    const texture = buildRadialGradientTexture(RADIAL_GRADIENT_SIZE);
    return buildNebulaGroup(texture);
  }, []);
  return <primitive object={sprites} />;
}
