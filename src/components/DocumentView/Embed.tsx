import * as gitbookAPI from '@gitbook/api';
import Script from 'next/script';

import { Card } from '@/components/primitives';
import { api } from '@/lib/api';
import { tcls } from '@/lib/tailwind';

import { BlockProps } from './Block';
import { Caption } from './Caption';
import { IntegrationBlock } from './Integration';

export async function Embed(props: BlockProps<gitbookAPI.DocumentBlockEmbed>) {
    const { block, context, ...otherProps } = props;

    const { data: embed } = await (context.content
        ? api().spaces.getEmbedByUrlInSpace(context.content.spaceId, { url: block.data.url })
        : api().urls.getEmbedByUrl({ url: block.data.url }));

    return (
        <Caption {...props}>
            {embed.type === 'rich' ? (
                <>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: embed.html,
                        }}
                    />
                    {/* We load the iframely script to resize the embed iframes dynamically */}
                    <Script src="https://cdn.iframe.ly/embed.js" defer async />
                </>
            ) : embed.type === 'integration' ? (
                <IntegrationBlock
                    {...otherProps}
                    context={context}
                    block={createIntegrationBlock(block.data.url, embed.block)}
                />
            ) : (
                <Card
                    leadingIcon={
                        embed.icon ? (
                            <img src={embed.icon} className={tcls('w-5', 'h-5')} alt="Logo" />
                        ) : null
                    }
                    href={block.data.url}
                    title={embed.title}
                    postTitle={embed.site}
                />
            )}
        </Caption>
    );
}

function createIntegrationBlock(
    url: string,
    block: gitbookAPI.IntegrationBlock,
): gitbookAPI.DocumentBlockIntegration {
    const data: gitbookAPI.DocumentBlockIntegration['data'] = {
        // TODO: wrong
        integration: 'embedDoltHubSQL',
        block: block.id,
        props: {},
        action: {
            action: '@link.unfurl',
            url,
        },
        url,
    };

    return {
        object: 'block',
        type: 'integration',
        isVoid: true,
        data,
    };
}
