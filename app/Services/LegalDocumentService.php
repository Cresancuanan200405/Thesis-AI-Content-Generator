<?php

namespace App\Services;

class LegalDocumentService
{
    public const TYPE_TERMS_OF_SERVICE = 'terms_of_service';

    public const TYPE_PRIVACY_NOTICE = 'privacy_notice';

    public const TYPE_CONTENT_IP_RESPONSIBILITY = 'content_ip_responsibility';

    public const TYPE_AI_CONTENT_RESPONSIBILITY = 'ai_content_responsibility';

    public const CURRENT_VERSION = 'v1.0';

    /**
     * Get all legal document definitions.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function getDocuments(): array
    {
        return [
            self::TYPE_TERMS_OF_SERVICE => [
                'type' => self::TYPE_TERMS_OF_SERVICE,
                'version' => self::CURRENT_VERSION,
                'title' => 'Terms of Service',
                'checkbox_label' => "I have read and agree to MarketPilot's Terms of Service, including its prohibited-use and content-generation rules.",
                'summary' => 'Rules and guidelines governing account access, acceptable use, user responsibilities, and marketing content generation in MarketPilot.',
                'sections' => [
                    [
                        'heading' => 'About MarketPilot',
                        'content' => 'MarketPilot is an AI-driven marketing content generation system designed to help businesses create promotional marketing content using business, product, industry, holiday/event, and campaign information.',
                    ],
                    [
                        'heading' => 'User Accounts',
                        'content' => 'Users are responsible for maintaining the security of their account credentials and providing accurate information required by the system. You agree to notify us immediately of any unauthorized use of your account.',
                    ],
                    [
                        'heading' => 'Business and Product Information',
                        'content' => 'Users provide business and product information used by MarketPilot for business management and marketing-content generation. You represent that the business information you submit is accurate and current.',
                    ],
                    [
                        'heading' => 'AI-Assisted Generation',
                        'content' => 'MarketPilot uses AI-assisted generation to create promotional marketing content. Generated content may depend on business information, product information, campaign configuration, event or holiday context, industry/category, creative style, visual theme, brand tone, tagline, price, and supplied reference/product imagery where applicable.',
                    ],
                    [
                        'heading' => 'User Responsibility',
                        'content' => 'Users are responsible for reviewing generated content before using it commercially. MarketPilot does not provide legal advice, and AI output is not automatically legally cleared or approved for commercial use without your independent review.',
                    ],
                    [
                        'heading' => 'Prohibited Use',
                        'content' => 'Users must not intentionally use MarketPilot to generate unlawful, defamatory, abusive, fraudulent, infringing, or otherwise prohibited content. System safeguards and content guidelines must be respected at all times.',
                    ],
                    [
                        'heading' => 'No Automatic Social Publishing',
                        'content' => 'MarketPilot generates marketing content for preview, download, and user management, but does not automatically publish or distribute generated content to Facebook, Instagram, or any external social media platforms. Social authentication is used solely for sign-in identification and does not grant social publishing capability.',
                    ],
                ],
            ],
            self::TYPE_PRIVACY_NOTICE => [
                'type' => self::TYPE_PRIVACY_NOTICE,
                'version' => self::CURRENT_VERSION,
                'title' => 'Privacy Notice',
                'checkbox_label' => 'I acknowledge that I have read the MarketPilot Privacy Notice and understand how my personal, business, product, and uploaded data are processed.',
                'summary' => 'How MarketPilot handles personal data, business profiles, uploaded assets, and AI generation data boundaries.',
                'sections' => [
                    [
                        'heading' => 'Account Information',
                        'content' => 'We process account credentials including username, email address, hashed passwords, and third-party authentication provider identifiers (such as Google OAuth profile IDs). Passwords are cryptographically hashed and never stored in plaintext.',
                    ],
                    [
                        'heading' => 'Personal Information',
                        'content' => 'During personal profile completion, MarketPilot may process your first name, middle name, last name, suffix, mobile number, and contact email address for account management and identification.',
                    ],
                    [
                        'heading' => 'Business Information',
                        'content' => 'MarketPilot processes business profile data including business name, business description, industry, category, street address, region, province, municipality/city, barangay, business contact number, business email, website/social page link, and registration metadata (registration type, registration number, business permit number, and registration/permit date).',
                    ],
                    [
                        'heading' => 'Product and Campaign Information',
                        'content' => 'We store product details (name, description, price, uploaded product images) and campaign configurations (marketing objective, visual theme, brand tone, render style, tagline, aspect ratio, selected event) to generate tailored promotional designs.',
                    ],
                    [
                        'heading' => 'Event and Generated Design Information',
                        'content' => 'We maintain records of Philippine national and cultural events, custom business events, generation request records, prompt parameter snapshots, model identifiers, generated image paths, and design history for in-app management and retrieval.',
                    ],
                    [
                        'heading' => 'Strict AI Prompt Boundary',
                        'content' => 'Only necessary marketing context is provided to the AI generation pipeline. User account names, personal names, mobile numbers, business registration numbers, business permit numbers, registration permit dates, registration documents, and legal acceptance records remain strictly outside the AI generation prompt.',
                    ],
                    [
                        'heading' => 'Registration Documents Privacy',
                        'content' => 'Optional business registration or permit documents are stored as private business records in secure, access-controlled storage. They are accessible only to the authenticated business owner, are never made public, are never sent to AI generation pipelines, and are not automatically verified against government databases.',
                    ],
                ],
            ],
            self::TYPE_CONTENT_IP_RESPONSIBILITY => [
                'type' => self::TYPE_CONTENT_IP_RESPONSIBILITY,
                'version' => self::CURRENT_VERSION,
                'title' => 'Content & IP Responsibility',
                'checkbox_label' => 'I confirm that I have the necessary rights or permission to upload and use product images, business materials, reference images, trademarks, and other assets provided to MarketPilot.',
                'summary' => 'Affirmation of intellectual property ownership and authorization for all user-supplied business assets and imagery.',
                'sections' => [
                    [
                        'heading' => 'Asset Ownership and Permissions',
                        'content' => 'You affirm that you possess all required ownership rights, licenses, or explicit permissions to upload and use product photographs, reference imagery, trademarks, logos, business slogans, and marketing materials submitted to MarketPilot.',
                    ],
                    [
                        'heading' => 'No Trademark or Copyright Infringement',
                        'content' => 'You agree not to upload materials or prompt the system to reproduce third-party copyrighted works, protected brand elements, or unauthorized likenesses without lawful permission.',
                    ],
                    [
                        'heading' => 'No Automatic Copyright Clearance',
                        'content' => 'MarketPilot does not guarantee copyright compliance, does not claim that AI-generated imagery is automatically copyright-free in all jurisdictions, and does not provide legal clearance. Users remain solely responsible for ensuring their use of marketing materials conforms with intellectual property laws.',
                    ],
                ],
            ],
            self::TYPE_AI_CONTENT_RESPONSIBILITY => [
                'type' => self::TYPE_AI_CONTENT_RESPONSIBILITY,
                'version' => self::CURRENT_VERSION,
                'title' => 'AI-Generated Content Responsibility',
                'checkbox_label' => 'I understand that AI-generated content may require human review and that I am responsible for reviewing generated materials before using them commercially.',
                'summary' => 'Human oversight, verification of promotional claims, and commercial deployment responsibility.',
                'sections' => [
                    [
                        'heading' => 'AI-Assisted Creative Process',
                        'content' => 'MarketPilot utilizes generative artificial intelligence to synthesize marketing visual compositions based on your business, product, and campaign parameters. Product or reference images may serve as visual inputs when selected.',
                    ],
                    [
                        'heading' => 'Mandatory Human Review',
                        'content' => 'Generative AI may produce visual anomalies, inaccurate textual elements, or unexpected outputs. You agree to perform human review of all generated materials prior to commercial publication, printing, or distribution.',
                    ],
                    [
                        'heading' => 'Accuracy and Commercial Claims',
                        'content' => 'You are responsible for verifying the accuracy of product specifications, pricing, promotional offers, disclaimers, and claims depicted in generated content before utilizing it in commercial marketing.',
                    ],
                ],
            ],
        ];
    }

    /**
     * Get the list of all required document types.
     *
     * @return array<int, string>
     */
    public static function getRequiredDocumentTypes(): array
    {
        return [
            self::TYPE_TERMS_OF_SERVICE,
            self::TYPE_PRIVACY_NOTICE,
            self::TYPE_CONTENT_IP_RESPONSIBILITY,
            self::TYPE_AI_CONTENT_RESPONSIBILITY,
        ];
    }

    /**
     * Get document definition by type.
     *
     * @return array<string, mixed>|null
     */
    public static function getDocument(string $type): ?array
    {
        return self::getDocuments()[$type] ?? null;
    }
}
