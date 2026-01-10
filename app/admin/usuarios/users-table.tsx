"use client";

import { Profile } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export function UsersTable({
  profiles,
  onToggleActive,
}: {
  profiles: Profile[];
  onToggleActive: (id: string, currentStatus: boolean) => Promise<void>;
}) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  if (!profiles) return <div>Cargando...</div>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Registrado</TableHead>
            <TableHead>Último Acceso</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                No hay usuarios registrados.
              </TableCell>
            </TableRow>
          ) : (
            profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">{profile.nombre}</TableCell>
                <TableCell>
                  <Badge
                    variant={profile.rol === "admin" ? "default" : "secondary"}
                  >
                    {profile.rol}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={profile.activo}
                      onCheckedChange={() =>
                        onToggleActive(profile.id, profile.activo)
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      {profile.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(profile.fecha_registro)}</TableCell>
                <TableCell>{formatDate(profile.ultimo_acceso)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
