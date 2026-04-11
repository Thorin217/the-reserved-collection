<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{ $proposal->title }}</title>
</head>
<body style="margin:0;padding:0;background-color:#121110;font-family:'Outfit',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#121110;min-width:100%;">
    <tr>
        <td align="center" style="padding:40px 16px;">

            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

                {{-- ── Logo header ── --}}
                <tr>
                    <td style="padding:32px 32px 24px 32px;border-bottom:1px solid #2c2a26;text-align:center;">
                        <div style="margin-bottom:5px;">
                            <span style="font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;color:#b87c3a;letter-spacing:0.12em;">THE RESERVED</span>
                            <span style="font-family:'Outfit',Arial,sans-serif;font-size:10px;color:rgba(212,206,200,0.35);letter-spacing:0.2em;text-transform:uppercase;font-weight:300;margin-left:8px;">Collection</span>
                        </div>
                        <div style="font-family:'Outfit',Arial,sans-serif;font-size:8px;color:rgba(212,206,200,0.35);letter-spacing:0.25em;text-transform:uppercase;font-weight:300;">
                            powered by <span style="color:rgba(184,124,58,0.55);font-weight:500;">KAZU</span>
                        </div>
                    </td>
                </tr>

                {{-- ── Body ── --}}
                <tr>
                    <td style="background-color:#1a1916;padding:36px 32px;">

                        {{-- Label + title --}}
                        <p style="margin:0 0 8px 0;font-family:'Outfit',Arial,sans-serif;font-size:9px;color:#7a756e;text-transform:uppercase;letter-spacing:0.28em;font-weight:300;">
                            Exclusive Proposal
                        </p>
                        <h1 style="margin:0 0 20px 0;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:26px;font-weight:300;color:#d4cec8;letter-spacing:0.03em;line-height:1.3;">
                            {{ $proposal->title }}
                        </h1>

                        {{-- Greeting --}}
                        <p style="margin:0 0 32px 0;font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#7a756e;line-height:1.7;font-weight:300;">
                            Dear {{ $client?->name ?? 'Valued Client' }},<br>
                            We are pleased to share the following curated selection with you.
                        </p>

                        {{-- Items --}}
                        @foreach ($items as $item)
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;border:1px solid #2c2a26;">
                            <tr>
                                <td style="padding:20px 24px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td style="vertical-align:top;">
                                                <p style="margin:0 0 3px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:400;color:#d4cec8;letter-spacing:0.02em;">{{ $item->name }}</p>
                                                @if ($item->model)
                                                <p style="margin:0 0 6px 0;font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#7a756e;font-weight:300;">{{ $item->model }}</p>
                                                @endif
                                                @if ($item->description)
                                                <p style="margin:8px 0 0 0;font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#7a756e;line-height:1.6;font-weight:300;">{{ $item->description }}</p>
                                                @endif
                                            </td>
                                            <td style="text-align:right;white-space:nowrap;padding-left:24px;vertical-align:top;">
                                                <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#b87c3a;">${{ number_format($item->suggested_price, 0, '.', ',') }}</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        @endforeach

                        {{-- Total --}}
                        @php $total = $items->sum(fn ($i) => floatval($i->suggested_price)); @endphp
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                            <tr>
                                <td style="padding-top:16px;border-top:1px solid #2c2a26;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td style="padding-top:16px;font-family:'Outfit',Arial,sans-serif;font-size:9px;color:#7a756e;text-transform:uppercase;letter-spacing:0.22em;font-weight:300;">Total</td>
                                            <td style="padding-top:16px;text-align:right;">
                                                <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:300;color:#b87c3a;">${{ number_format($total, 0, '.', ',') }}</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        @if ($proposal->notes)
                        <p style="margin:0 0 36px 0;font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#7a756e;font-style:italic;line-height:1.7;padding:16px 20px;border:1px solid #2c2a26;border-left:2px solid #b87c3a;">
                            {{ $proposal->notes }}
                        </p>
                        @endif

                        {{-- CTA --}}
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                            <tr>
                                <td align="center">
                                    <a href="{{ $previewUrl }}"
                                       style="display:inline-block;background-color:#b87c3a;color:#121110;font-family:'Outfit',Arial,sans-serif;font-size:9px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;padding:14px 44px;">
                                        View Full Proposal
                                    </a>
                                </td>
                            </tr>
                        </table>

                        <p style="margin:0;font-family:'Outfit',Arial,sans-serif;font-size:10px;color:#5a5550;text-align:center;letter-spacing:0.1em;">
                            This link expires in 7 days.
                        </p>

                    </td>
                </tr>

                {{-- ── Footer ── --}}
                <tr>
                    <td style="padding:24px 32px;border-top:1px solid #2c2a26;text-align:center;">
                        <p style="margin:0 0 4px 0;font-family:'Outfit',Arial,sans-serif;font-size:9px;color:rgba(212,206,200,0.30);text-transform:uppercase;letter-spacing:0.25em;font-weight:300;">
                            The Reserved Collection
                        </p>
                        <p style="margin:0;font-family:'Outfit',Arial,sans-serif;font-size:8px;color:rgba(212,206,200,0.20);letter-spacing:0.22em;text-transform:uppercase;font-weight:300;">
                            powered by <span style="color:rgba(184,124,58,0.40);">KAZU</span>
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>

</body>
</html>
