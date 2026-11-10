
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from scanner import scan_url, check_urlhaus

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

import os
import re
import socket
import ssl
import ipaddress
import certifi
import dns.resolver
import dns.exception

from dotenv import load_dotenv
from urllib.parse import urlparse


# ---------------------------------
# IP ADDRESS SECURITY
# ---------------------------------

def is_public_ip(ip_address):
    try:
        ip = ipaddress.ip_address(ip_address)
        return ip.is_global
    except ValueError:
        return False


# ---------------------------------
# ENVIRONMENT CONFIGURATION
# ---------------------------------

load_dotenv()

URLHAUS_AUTH_KEY = os.getenv("URLHAUS_AUTH_KEY")


# ---------------------------------
# FASTAPI APPLICATION
# ---------------------------------

app = FastAPI(
    title="CyberVault API",
    description="Backend for CyberVault",
    version="1.0.0"
)


# Rate limiting configuration
limiter = Limiter(key_func=get_remote_address)

app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler
)


# CORS configuration

allowed_origins = [
    "http://localhost:5173",
    "https://cyber-vault-eaoye3a2c-oeishani.vercel.app"
    "https://cyber-vault-c2nufnpzd-oeishani.vercel.app"
    "https://cyber-vault-mxcj407m5-oeishani.vercel.app"
]

frontend_url = os.getenv("FRONTEND_URL")

if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------
# BASIC ENDPOINTS
# ---------------------------------

@app.get("/")
def home():
    return {"message": "Welcome to CyberVault API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# ---------------------------------
# REQUEST MODELS
# ---------------------------------

class URLRequest(BaseModel):
    url: str


class DomainRequest(BaseModel):
    domain: str


# ---------------------------------
# URL SECURITY SCANNER
# ---------------------------------

@app.post("/scan-url")
@limiter.limit("10/minute")
def scan_website(request: Request, url_request: URLRequest):

    result = scan_url(url_request.url)

    if result.get("status") == "Invalid Input":
        result["urlhaus"] = {"status": "not_checked"}
        return result

    urlhaus_result = check_urlhaus(
        result.get("scanned_url", url_request.url),
        URLHAUS_AUTH_KEY
    )

    result["urlhaus"] = urlhaus_result

    return result

@app.post("/scan-qr-url")
@limiter.limit("10/minute")
def scan_qr_url(request: Request, url_request: URLRequest):

    result = scan_url(url_request.url)

    if result.get("status") == "Invalid Input":
        result["urlhaus"] = {"status": "not_checked"}
        return result

    urlhaus_result = check_urlhaus(
        result.get("scanned_url", url_request.url),
        URLHAUS_AUTH_KEY
    )

    result["urlhaus"] = urlhaus_result

    return result



# ---------------------------------
# DOMAIN INTELLIGENCE
# ---------------------------------

@app.post("/domain-intelligence")
@limiter.limit("10/minute")
def domain_intelligence(request: Request, domain_request: DomainRequest):

    domain_input = domain_request.domain.strip()

    # Parse domain or URL
    parsed = urlparse(
        domain_input if "://" in domain_input
        else f"https://{domain_input}"
    )

    domain = parsed.hostname
    # Reject IP addresses that are not public
    try:
        ip = ipaddress.ip_address(domain)
        if not ip.is_global:
            raise HTTPException(
                status_code=403,
                detail="Access to private or non-public IP addresses is blocked."
            )

    except ValueError:
        pass

    # Validate domain length
    if not domain or len(domain) > 253:
        raise HTTPException(
            status_code=400,
            detail="Invalid domain name."
        )

    # Validate domain format
    if not re.fullmatch(
        r"(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(?:\.(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?))*",
        domain
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid domain format."
        )

    # ---------------------------------
    # DNS LOOKUP WITH TIMEOUT
    # ---------------------------------

    dns_result = {}
    ip_address = None

    resolver = dns.resolver.Resolver()

    resolver.timeout = 3
    resolver.lifetime = 15

    ip_addresses = []

    try:

        # Retrieve IPv4 and IPv6 addresses
        for record_type in ["A", "AAAA"]:

            try:
                answers = resolver.resolve(
                    domain,
                    record_type
                )

                for answer in answers:
                    ip_addresses.append(answer.to_text())

            except dns.resolver.NoAnswer:
                continue

        # Remove duplicate addresses
        ip_addresses = sorted(set(ip_addresses))

        if not ip_addresses:
            raise HTTPException(
                status_code=400,
                detail="No IP addresses found for this domain."
            )

        # Check EVERY resolved IP address
        if not all(is_public_ip(ip) for ip in ip_addresses):
            raise HTTPException(
                status_code=403,
                detail="Access to private or non-public IP addresses is blocked."
            )

        # Select a validated public IP
        ip_address = ip_addresses[0]

        dns_result = {
            "status": "success",
            "ip_address": ip_address,
            "is_public": True
        }

    except dns.resolver.NXDOMAIN:

        raise HTTPException(
            status_code=400,
            detail="Domain does not exist."
        )

    except dns.exception.Timeout:

        raise HTTPException(
            status_code=504,
            detail="DNS lookup timed out."
        )

    except dns.resolver.NoNameservers:

        raise HTTPException(
            status_code=502,
            detail="DNS servers are unavailable."
        )

    # ---------------------------------
    # SSL CERTIFICATE VALIDATION
    # ---------------------------------

    ssl_result = {}

    if ip_address is None:

        ssl_result = {
            "status": "unavailable",
            "message": "Could not verify SSL certificate."
        }

    else:

        try:

            context = ssl.create_default_context(
                cafile=certifi.where()
            )

            # Connect only to the validated IP
            with socket.create_connection(
                (ip_address, 443),
                timeout=5
            ) as connection:

                with context.wrap_socket(
                    connection,
                    server_hostname=domain
                ) as secure_socket:

                    certificate = secure_socket.getpeercert()

                    ssl_result = {
                        "status": "valid",
                        "issuer": certificate.get("issuer"),
                        "expires": certificate.get("notAfter")
                    }

        except (OSError, ssl.SSLError, ValueError):

            ssl_result = {
                "status": "unavailable",
                "message": "Could not verify SSL certificate."
            }

    # ---------------------------------
    # FINAL RESPONSE
    # ---------------------------------

    return {
        "domain": domain,
        "dns": dns_result,
        "ssl": ssl_result
    }
