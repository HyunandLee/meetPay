# MeetPay

MeetPay is a prototype hiring workflow platform for managing **interview offers, structured communication, and micropayment-based payouts**.

This project explores how backend design and Web3-based payment infrastructure can reduce hiring friction, improve transparency, and lower intermediary costs.

## Features

- Offer-based interview workflow
- Thread-centered company-candidate communication
- Structured message types such as `offer`, `accept`, and `payment_notice`
- Explicit workflow states such as `offer_sent`, `accepted`, `interview_done`, and `paid`
- Micropayment / payout modeling for future Web3 payment integration

## Tech Stack

- TypeScript / JavaScript
- Node.js
- Supabase
- SQL
- wagmi
- viem
- Git / GitHub
- Linux

## Architecture

MeetPay is designed around a thread-centered workflow model.

Main entities:
- `threads`: company-candidate hiring interactions
- `messages`: typed communication inside each thread
- `interviews`: interview records
- `payouts`: payment tracking and transaction status

## What This Project Shows

This project demonstrates my interests and skills in:

- backend system design
- API / database modeling
- workflow-oriented product engineering
- practical Web3 application development

## Status

MeetPay is currently a prototype / proof of concept.  
The current focus is on workflow modeling, schema design, and payment integration architecture.

## About

I built MeetPay as a portfolio project to explore how software and programmable payments can solve real operational problems in hiring.

# MeetPay

MeetPayは、**面談オファー、構造化されたやり取り、少額報酬の支払い管理**を行うための採用ワークフロー・プロトタイプです。

採用における仲介コストやコミュニケーションの分断を減らし、より透明で直接的なやり取りを実現できないかを、バックエンド設計とWeb3決済の観点から検証するために開発しました。

## 主な機能

- 面談オファーを起点とした採用フロー管理
- 企業と候補者のやり取りをスレッド単位で管理
- `offer`、`accept`、`payment_notice` などの構造化メッセージ
- `offer_sent`、`accepted`、`interview_done`、`paid` などの状態遷移
- Web3決済連携を見据えた少額支払いモデル

## 技術スタック

- TypeScript / JavaScript
- Node.js
- Supabase
- SQL
- wagmi
- viem
- Git / GitHub
- Linux

## アーキテクチャ

MeetPayは、スレッド中心のワークフローモデルで設計されています。

主なエンティティ:
- `threads`: 企業と候補者の採用上のやり取り
- `messages`: 各スレッド内の構造化メッセージ
- `interviews`: 面談記録
- `payouts`: 支払い状況とトランザクション管理

## このプロジェクトで示していること

- バックエンド設計
- API / データベース設計
- ワークフロー中心のプロダクト設計
- 実用を意識したWeb3アプリケーション開発

## 開発状況

MeetPayは現在、プロトタイプ / PoC 段階です。  
現在はワークフロー設計、スキーマ設計、決済連携アーキテクチャの検討を中心に進めています。

## 補足

このリポジトリは、採用領域の実課題に対して、ソフトウェア設計とプログラマブルな決済基盤をどう接続できるかを探るポートフォリオプロジェクトでもあります。
